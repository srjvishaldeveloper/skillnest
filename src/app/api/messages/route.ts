import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function pruneOldMessages() {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  await prisma.chatMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  await pruneOldMessages();

  if (courseId) {
    const messages = await prisma.chatMessage.findMany({
      where: {
        courseId: parseInt(courseId),
        OR: [
          { senderId: session.userId },
          { receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  }

  const userId = session.userId;
  const role = session.role;

  let courseIds: number[] = [];
  if (role === "student") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: { courseId: true },
    });
    courseIds = enrollments.map((e) => e.courseId);
  } else if (role === "teacher") {
    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      select: { id: true },
    });
    courseIds = courses.map((c) => c.id);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { courseId: { in: courseIds } },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, message, receiverId, receiverRole } = await req.json();
  if (!courseId || !message || !receiverId || !receiverRole) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const created = await prisma.chatMessage.create({
    data: {
      senderId: session.userId,
      senderRole: session.role,
      receiverId,
      receiverRole,
      courseId,
      message,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const courseId = searchParams.get("courseId");

  if (id) {
    const msg = await prisma.chatMessage.findUnique({ where: { id: parseInt(id) } });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (msg.senderId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.chatMessage.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  }

  if (courseId) {
    await prisma.chatMessage.deleteMany({
      where: {
        courseId: parseInt(courseId),
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide id or courseId" }, { status: 400 });
}
