import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

/**
 * GET /api/courses/featured?limit=3
 *
 * Published courses for the JobNest landing-page "Learning Hub" section.
 * Returns display fields only: lesson (module) count, enrolled learners,
 * average review rating, level and a deep link to the course on SkillNest.
 * Unlike /api/courses (skill-gap, requires ?skills), this needs no params.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 3) || 3, 12);

  const courses = await prisma.course.findMany({
    where: { published: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      level: true,
      img: true,
      trailerUrl: true,
      reviews: { select: { rating: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
    orderBy: { id: "desc" },
    take: limit,
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const payload = courses.map((c) => {
    const ratingCount = c.reviews.length;
    const ratingAvg = ratingCount
      ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : null;
    return {
      id: c.id,
      title: c.title,
      level: c.level,
      img: c.img,
      trailer: c.trailerUrl,
      lessons: c._count.modules,
      learners: c._count.enrollments,
      rating: ratingAvg !== null ? Number(ratingAvg.toFixed(1)) : null,
      url: `${appUrl}/course/${c.id}`,
    };
  });

  return NextResponse.json({ courses: payload });
}
