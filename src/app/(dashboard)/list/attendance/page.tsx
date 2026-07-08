import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const role = session?.role;

  // ── Admin: all courses with enrolled students and their progress ──
  if (role === "admin") {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { enrollments: true } },
        modules: { include: { _count: { select: { lessons: true } } } },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, username: true, img: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalLessonsMap = new Map<number, number>();
    courses.forEach((c) =>
      totalLessonsMap.set(c.id, c.modules.reduce((s, m) => s + m._count.lessons, 0))
    );

    const allProgress = await prisma.lessonProgress.findMany({
      where: {
        lesson: { module: { courseId: { in: courses.map((c) => c.id) } } },
      },
      select: {
        studentId: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    });

    const progressMap = buildProgressMap(allProgress);
    const overallEnrollments = courses.reduce((s, c) => s + c._count.enrollments, 0);

    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Course Attendance</h1>
          <p className="text-sm text-gray-500">
            {courses.length} courses · {overallEnrollments} enrollments
          </p>
        </div>
        {renderCourseTable(courses, totalLessonsMap, progressMap)}
      </div>
    );
  }

  // ── Teacher: own courses with enrolled students + progress ──
  if (role === "teacher") {
    const courses = await prisma.course.findMany({
      where: { instructorId: session?.userId },
      include: {
        _count: { select: { enrollments: true } },
        modules: { include: { _count: { select: { lessons: true } } } },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, username: true, img: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalLessonsMap = new Map<number, number>();
    courses.forEach((c) =>
      totalLessonsMap.set(c.id, c.modules.reduce((s, m) => s + m._count.lessons, 0))
    );

    const allProgress = await prisma.lessonProgress.findMany({
      where: {
        studentId: { in: courses.flatMap((c) => c.enrollments.map((e) => e.studentId)) },
        lesson: { module: { courseId: { in: courses.map((c) => c.id) } } },
      },
      select: {
        studentId: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    });

    const progressMap = buildProgressMap(allProgress);

    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Course Attendance</h1>
          <p className="text-sm text-gray-500">
            {courses.length} courses · {courses.reduce((s, c) => s + c._count.enrollments, 0)} enrollments
          </p>
        </div>
        {courses.length === 0 ? (
          <p className="mt-8 text-sm text-gray-400">
            You haven&apos;t created any courses yet.{" "}
            <Link href="/courses" className="text-skillBlue hover:underline">Create one →</Link>
          </p>
        ) : (
          renderCourseTable(courses, totalLessonsMap, progressMap)
        )}
      </div>
    );
  }

  // ── Student: own course progress ──
  if (role === "student" && session?.userId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.userId },
      include: {
        course: {
          include: {
            modules: { include: { _count: { select: { lessons: true } } } },
            instructor: { select: { name: true } },
          },
        },
      },
    });

    const courseIds = enrollments.map((e) => e.course.id);
    const allProgress = await prisma.lessonProgress.findMany({
      where: { studentId: session.userId, lesson: { module: { courseId: { in: courseIds } } } },
      select: { lesson: { select: { module: { select: { courseId: true } } } } },
    });

    const doneMap = new Map<number, number>();
    allProgress.forEach((p) => {
      const cId = p.lesson.module.courseId;
      doneMap.set(cId, (doneMap.get(cId) || 0) + 1);
    });

    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">My Course Attendance</h1>
          <p className="text-sm text-gray-500">{enrollments.length} courses enrolled</p>
        </div>
        {enrollments.length === 0 ? (
          <p className="mt-8 text-sm text-gray-400">
            You haven&apos;t enrolled in any courses yet.{" "}
            <Link href="/browse" className="text-skillBlue hover:underline">Browse courses →</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-400">
                  <th className="py-3 pr-4 font-medium">Course</th>
                  <th className="py-3 pr-4 font-medium">Instructor</th>
                  <th className="py-3 pr-4 font-medium">Progress</th>
                  <th className="py-3 pr-4 font-medium">Lessons Done</th>
                  <th className="py-3 pr-4 font-medium">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(({ course }) => {
                  const total = course.modules.reduce((s, m) => s + m._count.lessons, 0);
                  const done = doneMap.get(course.id) || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <tr key={course.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium">{course.title}</td>
                      <td className="py-3 pr-4 text-xs text-gray-500">{course.instructor.name}</td>
                      <td className="pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100 ? "bg-skillGreen" : pct > 0 ? "bg-skillBlue" : "bg-gray-200"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{pct}%</span>
                        </div>
                      </td>
                      <td className="pr-4 text-xs text-gray-500">{done}/{total}</td>
                      <td>
                        {pct === 100 && total > 0 ? (
                          <Link
                            href="/certificates"
                            className="rounded-full bg-skillGreen/10 px-2.5 py-0.5 text-xs font-medium text-skillGreen"
                          >
                            ✅ View Certificate
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Parent: children's course progress ──
  if (role === "parent" && session?.userId) {
    const children = await prisma.student.findMany({ where: { parentId: session.userId } });
    const studentIds = children.map((c) => c.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: { select: { id: true, name: true, username: true, img: true } },
        course: {
          include: {
            modules: { include: { _count: { select: { lessons: true } } } },
            instructor: { select: { name: true } },
          },
        },
      },
    });

    const allProgress = await prisma.lessonProgress.findMany({
      where: {
        studentId: { in: studentIds },
        lesson: { module: { courseId: { in: enrollments.map((e) => e.course.id) } } },
      },
      select: {
        studentId: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    });

    const progressMap = buildProgressMap(allProgress);

    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">My Children&apos;s Course Attendance</h1>
        </div>
        {children.length === 0 ? (
          <p className="mt-8 text-sm text-gray-400">No children linked to your account.</p>
        ) : (
          enrollments.length === 0 ? (
            <p className="mt-8 text-sm text-gray-400">Your children haven&apos;t enrolled in any courses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-400">
                    <th className="py-3 pr-4 font-medium">Child</th>
                    <th className="py-3 pr-4 font-medium">Course</th>
                    <th className="py-3 pr-4 font-medium">Instructor</th>
                    <th className="py-3 pr-4 font-medium">Progress</th>
                    <th className="py-3 pr-4 font-medium">Lessons Done</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(({ student, course }) => {
                    const total = course.modules.reduce((s, m) => s + m._count.lessons, 0);
                    const done = progressMap.get(student.id)?.get(course.id) || 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    return (
                      <tr key={`${student.id}-${course.id}`} className="border-b border-gray-100">
                        <td className="flex items-center gap-3 py-3 pr-4">
                          <Image
                            src={student.img || "/noAvatar.png"}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="font-medium">{student.name}</span>
                        </td>
                        <td className="py-3 pr-4 font-medium">{course.title}</td>
                        <td className="py-3 pr-4 text-xs text-gray-500">{course.instructor.name}</td>
                        <td className="pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct === 100 ? "bg-skillGreen" : pct > 0 ? "bg-skillBlue" : "bg-gray-200"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{pct}%</span>
                          </div>
                        </td>
                        <td className="pr-4 text-xs text-gray-500">{done}/{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
      <h1 className="text-lg font-semibold">Course Attendance</h1>
      <p className="mt-4 text-sm text-gray-400">Please sign in to view your attendance.</p>
    </div>
  );
};

// ── Helpers ──

type ProgressRow = {
  studentId: string;
  lesson: { module: { courseId: number } };
};

function buildProgressMap(allProgress: ProgressRow[]) {
  const map = new Map<string, Map<number, number>>();
  allProgress.forEach((p) => {
    const cId = p.lesson.module.courseId;
    if (!map.has(p.studentId)) map.set(p.studentId, new Map());
    const courseMap = map.get(p.studentId)!;
    courseMap.set(cId, (courseMap.get(cId) || 0) + 1);
  });
  return map;
}

type CourseWithEnrollments = {
  id: number;
  title: string;
  modules: { _count: { lessons: number } }[];
  _count: { enrollments: number };
  enrollments: {
    student: { id: string; name: string; username: string; img: string | null };
  }[];
};

function renderCourseTable(
  courses: CourseWithEnrollments[],
  totalLessonsMap: Map<number, number>,
  progressMap: Map<string, Map<number, number>>
) {
  return courses.map((course) => {
    const total = totalLessonsMap.get(course.id) || 0;

    return (
      <div key={course.id} className="mb-8">
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <div>
            <span className="font-semibold">{course.title}</span>
            <span className="ml-2 text-xs text-gray-400">
              {course._count.enrollments} enrolled · {total} lessons
            </span>
          </div>
        </div>

        {course.enrollments.length === 0 ? (
          <p className="py-2 text-sm text-gray-400">No enrollments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-400">
                  <th className="py-2 pr-4 font-medium">Learner</th>
                  <th className="py-2 pr-4 font-medium">Progress</th>
                  <th className="py-2 pr-4 font-medium">Lessons Done</th>
                  <th className="py-2 pr-4 font-medium">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {course.enrollments.map((enrollment) => {
                  const done = progressMap.get(enrollment.student.id)?.get(course.id) || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const student = enrollment.student;

                  return (
                    <tr key={student.id} className="border-b border-gray-100">
                      <td className="flex items-center gap-3 py-3 pr-4">
                        <Image
                          src={student.img || "/noAvatar.png"}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div>
                          <Link
                            href={`/list/students/${student.id}`}
                            className="font-medium hover:text-skillBlue"
                          >
                            {student.name}
                          </Link>
                          <p className="text-xs text-gray-400">{student.username}</p>
                        </div>
                      </td>
                      <td className="pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100
                                  ? "bg-skillGreen"
                                  : pct > 0
                                    ? "bg-skillBlue"
                                    : "bg-gray-200"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{pct}%</span>
                        </div>
                      </td>
                      <td className="pr-4 text-xs text-gray-500">
                        {done}/{total}
                      </td>
                      <td>
                        {pct === 100 && total > 0 ? (
                          <span className="rounded-full bg-skillGreen/10 px-2.5 py-0.5 text-xs font-medium text-skillGreen">
                            ✅ Certified
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  });
}

export default AttendanceListPage;
