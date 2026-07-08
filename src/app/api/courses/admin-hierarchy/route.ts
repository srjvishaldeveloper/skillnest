import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const role = session?.role;
  const userId = session?.userId;

  if (!userId) return NextResponse.json({ role: "", userId: "", courses: [] });

  if (role === "admin") {
    const allTeachers = await prisma.teacher.findMany({
      include: {
        _count: { select: { courses: true, subTeachers: true } },
        parentTeacher: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const parentTeachers = allTeachers
      .filter((t) => !t.parentTeacherId)
      .map((t) => ({
        id: t.id,
        name: t.name,
        img: t.img,
        isParent: true,
        parentTeacher: null,
        _count: t._count,
        courses: [] as any[],
        subTeachers: [] as any[],
      }));

    const subTeachers = allTeachers.filter((t) => t.parentTeacherId);

    const allCourses = await prisma.course.findMany({
      include: {
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // attach courses to parent teachers and sub-teachers
    for (const pt of parentTeachers) {
      const myCourses = allCourses.filter((c) => c.instructorId === pt.id);
      const mySubs = subTeachers.filter((st) => st.parentTeacherId === pt.id);
      
      const subTeacherNodes = mySubs.map((st) => {
        const stCourses = allCourses.filter((c) => c.instructorId === st.id);
        return {
          id: st.id,
          name: st.name,
          img: st.img,
          isParent: false,
          parentTeacher: { id: pt.id, name: pt.name },
          _count: { courses: stCourses.length, subTeachers: 0 },
          courses: stCourses,
          subTeachers: [],
        };
      });

      const totalTeamCoursesCount = myCourses.length + subTeacherNodes.reduce((sum, st) => sum + st.courses.length, 0);

      pt.courses = myCourses;
      pt.subTeachers = subTeacherNodes;
      pt._count = {
        courses: totalTeamCoursesCount,
        subTeachers: mySubs.length,
      };
    }

    return NextResponse.json({
      role,
      userId,
      isUnverified: false,
      parentTeachers,
      allCourses,
    });
  }

  // teacher role
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId },
    select: { isVerified: true },
  });

  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    role,
    userId,
    isUnverified: teacher ? !teacher.isVerified : true,
    courses,
  });
}
