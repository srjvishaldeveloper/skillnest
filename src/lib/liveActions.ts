"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { getSession } from "./auth";
import { notify } from "./notify";
import { tpl } from "./notifyTemplates";

// instructor of the course, or admin
async function canManage(courseId: number) {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return session;
  if (session.role !== "teacher") return null;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== session.userId) return null;
  return session;
}

// unguessable-ish Jitsi room on the free public server
function makeJitsiUrl(courseId: number) {
  const rand = Math.random().toString(36).slice(2, 9);
  return `https://meet.jit.si/SkillNest-c${courseId}-${rand}`;
}

export const scheduleLiveClass = async (
  courseId: number,
  title: string,
  scheduledAt: string,
  durationMin: number
) => {
  const session = await canManage(courseId);
  if (!session) return { success: false, error: "Not authorized" };
  if (!title.trim() || !scheduledAt)
    return { success: false, error: "Title and date/time required" };

  const when = new Date(scheduledAt);
  if (isNaN(when.getTime())) return { success: false, error: "Invalid date/time" };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, instructorId: true },
  });
  if (!course) return { success: false, error: "Course not found" };

  const live = await prisma.liveClass.create({
    data: {
      courseId,
      instructorId: course.instructorId,
      title: title.trim(),
      scheduledAt: when,
      durationMin: Math.max(10, Math.round(durationMin || 60)),
      meetingUrl: makeJitsiUrl(courseId),
    },
  });

  // email enrolled learners about the scheduled live class
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { student: { select: { email: true, name: true } } },
  });
  const whenStr = when.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  await Promise.allSettled(
    enrollments
      .filter((e) => e.student.email)
      .map((e) => {
        const t = tpl.liveClassScheduled(
          e.student.name,
          course.title,
          live.title,
          whenStr,
          courseId
        );
        return notify({
          email: { to: e.student.email!, subject: t.subject, html: t.html },
        });
      })
  );

  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/learn/${courseId}`);
  return { success: true };
};

export const deleteLiveClass = async (liveClassId: number, courseId: number) => {
  const session = await canManage(courseId);
  if (!session) return;
  await prisma.liveClass.delete({ where: { id: liveClassId } });
  revalidatePath(`/courses/${courseId}`);
};

/**
 * Record attendance when an enrolled learner joins, and return the room URL.
 * Idempotent — joining again won't duplicate the attendance row.
 */
export const joinLiveClass = async (liveClassId: number) => {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in" };

  const live = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!live) return { ok: false, error: "Live class not found" };

  if (session.role === "student") {
    const enrolled = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: session.userId, courseId: live.courseId },
      },
    });
    if (!enrolled) return { ok: false, error: "Enroll to join this class" };

    await prisma.liveAttendance.upsert({
      where: {
        liveClassId_studentId: { liveClassId, studentId: session.userId },
      },
      create: { liveClassId, studentId: session.userId },
      update: {},
    });
  }

  return { ok: true, meetingUrl: live.meetingUrl };
};
