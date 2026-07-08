import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { tpl } from "@/lib/notifyTemplates";
import { ensureStudent } from "@/lib/learner";

/**
 * GET  /api/courses/[id]/enroll  — check enrollment status
 * POST /api/courses/[id]/enroll  — enroll in free course (paid courses require /api/payment/initiate)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ enrolled: false, error: "Unauthorized" }, { status: 401 });
  }

  const courseId = Number(params.id);
  if (!courseId) return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });

  return NextResponse.json({ enrolled: !!enrollment, courseId });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.userId || session.role !== "student") {
    return NextResponse.json({ error: "Sign in as a learner to enroll" }, { status: 401 });
  }

  const courseId = Number(params.id);
  if (!courseId) return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, price: true, published: true },
  });
  if (!course || !course.published) {
    return NextResponse.json({ error: "Course not available" }, { status: 404 });
  }
  if (course.price > 0) {
    return NextResponse.json(
      { error: "This is a paid course. Use /api/payment/initiate to purchase." },
      { status: 402 }
    );
  }

  // Ensure SSO-provisioned learners have a Student row
  await ensureStudent(session);

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });
  if (existing) {
    return NextResponse.json({ enrolled: true, message: "Already enrolled" });
  }

  await prisma.enrollment.create({ data: { studentId: session.userId, courseId } });

  // Send enrollment confirmation email (fire-and-forget)
  const student = await prisma.student.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true },
  });
  if (student?.email) {
    const t = tpl.enrolled(student.name, course.title, course.id);
    notify({ email: { to: student.email, subject: t.subject, html: t.html } }).catch(() => {});
  }

  return NextResponse.json({ enrolled: true, courseId, message: "Enrolled successfully" });
}
