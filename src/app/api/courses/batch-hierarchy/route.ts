import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const role = session?.role;
  const userId = session?.userId;

  if (!userId) return NextResponse.json({ role: "", userId: "", courses: [] });

  // revenue data for all paid orders
  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    select: { amount: true, courseId: true },
  });
  const revenueByCourse = new Map<number, number>();
  paidOrders.forEach((o) => {
    revenueByCourse.set(o.courseId, (revenueByCourse.get(o.courseId) || 0) + o.amount);
  });

  const attachRevenue = (c: any) => ({
    ...c,
    revenue: revenueByCourse.get(c.id) || 0,
  });

  if (role === "admin") {
    const allTeachers = await prisma.teacher.findMany({
      include: { _count: { select: { courses: true, subTeachers: true } } },
    });

    const parentTeachers = allTeachers
      .filter((t) => t._count.subTeachers > 0)
      .map((t) => ({ id: t.id, name: t.name, _count: t._count, courses: [] as any[], subTeachers: [] as any[] }));

    const subTeachers = allTeachers.filter((t) => t.parentTeacherId);

    const allCourses = await prisma.course.findMany({
      include: {
        instructor: { select: { name: true, id: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const linkedTeacherIds = parentTeachers.map((pt) => pt.id).concat(subTeachers.map((st) => st.id));

    parentTeachers.forEach((pt) => {
      pt.courses = allCourses.filter((c) => c.instructorId === pt.id).map(attachRevenue);
      pt.subTeachers = subTeachers
        .filter((st) => st.parentTeacherId === pt.id)
        .map((st) => ({
          id: st.id,
          name: st.name,
          _count: { courses: allCourses.filter((c) => c.instructorId === st.id).length, subTeachers: 0 },
          courses: allCourses.filter((c) => c.instructorId === st.id).map(attachRevenue),
          subTeachers: [],
        }));
    });

    const standaloneCourses = allCourses
      .filter((c) => !linkedTeacherIds.includes(c.instructorId))
      .map(attachRevenue);

    return NextResponse.json({ role, userId, parentTeachers, standaloneCourses });
  }

  // teacher / other roles
  const courseWhere =
    role === "teacher" ? { instructorId: userId } : {};

  const courses = await prisma.course.findMany({
    where: courseWhere,
    include: {
      instructor: { select: { name: true, id: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    role: role || "",
    userId,
    courses: courses.map(attachRevenue),
  });
}
