import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/courses/[id]
 * Returns full course details + enrollment status for the current user.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = Number(params.id);
  if (!courseId || isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  const session = await getSession();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true, img: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, description: true, isFreePreview: true, duration: true, order: true },
          },
        },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { student: { select: { name: true, img: true } } },
      },
      courseSkills: { select: { skillSlug: true } },
      _count: { select: { enrollments: true, reviews: true, modules: true } },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (!course.published) {
    return NextResponse.json({ error: "Course not available" }, { status: 404 });
  }

  // Check enrollment status if logged in
  let isEnrolled = false;
  if (session?.userId && session.role === "student") {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.userId, courseId } },
    });
    isEnrolled = !!enrollment;
  }

  const ratingAvg =
    course.reviews.length > 0
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : 0;

  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

  return NextResponse.json({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      img: course.img,
      published: course.published,
      skills: course.courseSkills.map((s) => s.skillSlug),
      instructor: course.instructor,
      modules: course.modules,
      reviews: course.reviews,
      ratingAvg: Math.round(ratingAvg * 10) / 10,
      totalReviews: course._count.reviews,
      totalEnrollments: course._count.enrollments,
      totalModules: course._count.modules,
      isEnrolled,
      url: `${APP_URL}/learn/${course.id}`,
    },
  });
}
