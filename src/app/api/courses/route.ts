import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

/**
 * GET /api/courses?skills=react,node&limit=3
 *
 * Returns published courses that teach any of the requested canonical skill
 * slugs (CourseSkill.skillSlug == peeldb.Skill.slug). Consumed by the JobNest
 * skill-gap endpoint to recommend courses that close a candidate's gap.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillsParam = (searchParams.get("skills") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 6) || 6, 20);

  if (!skillsParam) {
    return NextResponse.json({ courses: [] });
  }

  const slugs = skillsParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json({ courses: [] });
  }

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      status: "PUBLISHED",
      courseSkills: { some: { skillSlug: { in: slugs } } },
    },
    select: {
      id: true,
      title: true,
      category: true,
      level: true,
      price: true,
      img: true,
      courseSkills: { select: { skillSlug: true } },
    },
    take: limit,
    orderBy: { id: "desc" },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const payload = courses.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    level: c.level,
    price: c.price,
    img: c.img,
    skills: c.courseSkills.map((cs) => cs.skillSlug),
    url: `${appUrl}/course/${c.id}`,
  }));

  return NextResponse.json({ courses: payload });
}
