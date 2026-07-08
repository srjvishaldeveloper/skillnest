import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.userId;
  const role = session.role;

  if (role === "student") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            img: true,
            instructor: { select: { id: true, name: true, img: true } },
          },
        },
      },
    });
    const courses = enrollments.map((e) => e.course);
    return NextResponse.json(courses);
  }

  if (role === "teacher") {
    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      select: {
        id: true,
        title: true,
        img: true,
        instructor: { select: { id: true, name: true, img: true } },
      },
    });
    return NextResponse.json(courses);
  }

  return NextResponse.json([]);
}
