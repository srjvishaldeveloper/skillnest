"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { getSession, SessionPayload } from "./auth";
import { notify } from "./notify";
import { tpl } from "./notifyTemplates";

// nice display name for the current user (no single User table exists)
async function displayName(session: SessionPayload): Promise<string> {
  if (session.role === "student") {
    const s = await prisma.student.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });
    if (s) return s.name;
  } else if (session.role === "teacher") {
    const t = await prisma.teacher.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });
    if (t) return t.name;
  } else if (session.role === "admin") {
    return "Admin";
  }
  return session.username;
}

// can the user participate in a course's discussion?
// enrolled learner, the course instructor, or an admin
async function canParticipate(session: SessionPayload, courseId: number) {
  if (session.role === "admin") return true;
  if (session.role === "teacher") {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    return !!course && course.instructorId === session.userId;
  }
  if (session.role === "student") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.userId, courseId } },
    });
    return !!enrolled;
  }
  return false;
}

/* ============================ THREADS ============================ */

export const createDiscussion = async (
  courseId: number,
  title: string,
  body: string
) => {
  const session = await getSession();
  if (!session) return { success: false, error: true, message: "Not signed in" };
  if (!(await canParticipate(session, courseId))) {
    return { success: false, error: true, message: "Enroll to ask a question" };
  }
  if (!title.trim() || !body.trim()) {
    return { success: false, error: true, message: "Title and details required" };
  }

  const name = await displayName(session);
  const d = await prisma.discussion.create({
    data: {
      courseId,
      title: title.trim(),
      body: body.trim(),
      authorId: session.userId,
      authorRole: session.role,
      authorName: name,
    },
  });

  // notify the course instructor about the new question
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, instructor: { select: { email: true, name: true } } },
  });
  if (course?.instructor.email) {
    const t = tpl.newQuestion(course.instructor.name, course.title, title.trim(), courseId, d.id);
    await notify({ email: { to: course.instructor.email, subject: t.subject, html: t.html } });
  }

  revalidatePath(`/discuss/${courseId}`);
  return { success: true, error: false, id: d.id };
};

export const toggleResolved = async (discussionId: number, courseId: number) => {
  const session = await getSession();
  if (!session) return;
  const d = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!d) return;
  // author, course instructor, or admin
  const allowed =
    d.authorId === session.userId || (await canParticipate(session, courseId));
  if (!allowed) return;
  await prisma.discussion.update({
    where: { id: discussionId },
    data: { resolved: !d.resolved },
  });
  revalidatePath(`/discuss/${courseId}/${discussionId}`);
  revalidatePath(`/discuss/${courseId}`);
};

export const deleteDiscussion = async (discussionId: number, courseId: number) => {
  const session = await getSession();
  if (!session) return;
  const d = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!d) return;
  const isInstructorOrAdmin =
    session.role === "admin" ||
    (session.role === "teacher" && (await canParticipate(session, courseId)));
  if (d.authorId !== session.userId && !isInstructorOrAdmin) return;
  await prisma.discussion.delete({ where: { id: discussionId } });
  revalidatePath(`/discuss/${courseId}`);
};

/* ============================ REPLIES ============================ */

export const createReply = async (
  discussionId: number,
  courseId: number,
  body: string
) => {
  const session = await getSession();
  if (!session) return { success: false, error: true, message: "Not signed in" };
  if (!(await canParticipate(session, courseId))) {
    return { success: false, error: true, message: "Not allowed" };
  }
  if (!body.trim()) return { success: false, error: true, message: "Empty reply" };

  const name = await displayName(session);
  await prisma.discussionReply.create({
    data: {
      discussionId,
      body: body.trim(),
      authorId: session.userId,
      authorRole: session.role,
      authorName: name,
    },
  });

  // if an instructor/admin replied, email the learner who asked
  if (session.role === "teacher" || session.role === "admin") {
    const thread = await prisma.discussion.findUnique({
      where: { id: discussionId },
      select: {
        title: true,
        authorId: true,
        authorRole: true,
        course: { select: { title: true } },
      },
    });
    if (thread && thread.authorRole === "student") {
      const asker = await prisma.student.findUnique({
        where: { id: thread.authorId },
        select: { email: true, name: true },
      });
      if (asker?.email) {
        const t = tpl.answered(
          asker.name,
          thread.course.title,
          thread.title,
          courseId,
          discussionId
        );
        await notify({ email: { to: asker.email, subject: t.subject, html: t.html } });
      }
    }
  }

  revalidatePath(`/discuss/${courseId}/${discussionId}`);
  return { success: true, error: false };
};

export const deleteReply = async (
  replyId: number,
  courseId: number,
  discussionId: number
) => {
  const session = await getSession();
  if (!session) return;
  const r = await prisma.discussionReply.findUnique({ where: { id: replyId } });
  if (!r) return;
  const isInstructorOrAdmin =
    session.role === "admin" ||
    (session.role === "teacher" && (await canParticipate(session, courseId)));
  if (r.authorId !== session.userId && !isInstructorOrAdmin) return;
  await prisma.discussionReply.delete({ where: { id: replyId } });
  revalidatePath(`/discuss/${courseId}/${discussionId}`);
};
