import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const MyLearningPage = async () => {
  const session = await getSession();

  if (session?.role !== "student") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">My Learning</h1>
        <p className="mt-4 text-sm text-gray-400">
          Only learners have enrolled courses.{" "}
          <Link href="/browse" className="text-skillBlue hover:underline">
            Browse courses →
          </Link>
        </p>
      </div>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.userId },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          modules: { include: { _count: { select: { lessons: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // progress per course
  const completed = await prisma.lessonProgress.findMany({
    where: { studentId: session.userId },
    include: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  const completedByCourse = new Map<number, number>();
  completed.forEach((p) => {
    const cId = p.lesson.module.courseId;
    completedByCourse.set(cId, (completedByCourse.get(cId) || 0) + 1);
  });

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Learning</h1>
        <Link href="/browse" className="text-sm font-medium text-skillBlue">
          Browse more →
        </Link>
      </div>

      {enrollments.length === 0 && (
        <p className="mt-8 text-sm text-gray-400">
          You haven&apos;t enrolled in any course yet.{" "}
          <Link href="/browse" className="text-skillBlue hover:underline">
            Find a course →
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map(({ course }) => {
          const totalLessons = course.modules.reduce(
            (sum, m) => sum + m._count.lessons,
            0
          );
          const done = completedByCourse.get(course.id) || 0;
          const progress = totalLessons
            ? Math.round((done / totalLessons) * 100)
            : 0;
          return (
            <Link
              key={course.id}
              href={`/learn/${course.id}`}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 transition hover:shadow-md"
            >
              <div className="relative h-32 bg-gradient-to-br from-skillBlue/20 to-skillPurple/20">
                {course.img && (
                  <img src={course.img} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="font-semibold leading-snug">{course.title}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {course.instructor.name}
                </p>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {done}/{totalLessons} lessons
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-skillGreen"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MyLearningPage;
