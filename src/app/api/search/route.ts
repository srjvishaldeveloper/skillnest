import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/search?q=react&type=courses|problems|all&limit=10
 *
 * Unified search across courses and coding problems.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type") || "all";
  const limit = Math.min(Number(searchParams.get("limit") || 10) || 10, 30);

  if (!q) {
    return NextResponse.json({ courses: [], problems: [], total: 0 });
  }

  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

  const [courses, problems] = await Promise.all([
    type !== "problems"
      ? prisma.course.findMany({
          where: {
            published: true,
            status: "PUBLISHED",
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            price: true,
            img: true,
            _count: { select: { enrollments: true } },
          },
          take: limit,
          orderBy: { id: "desc" },
        })
      : [],

    type !== "courses"
      ? prisma.problem.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            difficulty: true,
            slug: true,
            tags: { select: { tag: { select: { name: true } } } },
          },
          take: limit,
          orderBy: { id: "desc" },
        })
      : [],
  ]);

  const courseResults = courses.map((c) => ({
    type: "course" as const,
    id: c.id,
    title: c.title,
    category: c.category,
    level: c.level,
    price: c.price,
    img: c.img,
    enrollments: c._count.enrollments,
    url: `${APP_URL}/course/${c.id}`,
  }));

  const problemResults = (problems as any[]).map((p) => ({
    type: "problem" as const,
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    slug: p.slug,
    tags: p.tags?.map((t: any) => t.tag.name) || [],
    url: `${APP_URL}/problems/${p.slug}`,
  }));

  return NextResponse.json({
    courses: courseResults,
    problems: problemResults,
    total: courseResults.length + problemResults.length,
    query: q,
  });
}
