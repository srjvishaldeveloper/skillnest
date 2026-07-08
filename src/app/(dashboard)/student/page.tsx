import Link from "next/link";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import { getSession } from "@/lib/auth";
import { getCmsPage } from "@/lib/cms";
import prisma from "@/lib/prisma";
import CopyParentInvite from "@/components/CopyParentInvite";

const StudentPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const userId = session?.userId;
  const cms = await getCmsPage("studentDashboard");

  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: userId! } },
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId! },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        include: { modules: { include: { _count: { select: { lessons: true } } } } },
      },
    },
  });

  const completed = await prisma.lessonProgress.findMany({
    where: { studentId: userId! },
    include: { lesson: { select: { module: { select: { courseId: true } } } } },
  });

  const certCount = await prisma.certificate.count({
    where: { studentId: userId! },
  });

  const doneByCourse = new Map<number, number>();
  completed.forEach((progress) => {
    const courseId = progress.lesson.module.courseId;
    doneByCourse.set(courseId, (doneByCourse.get(courseId) || 0) + 1);
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-skillDark px-6 py-5 text-white">
        <div>
          <h1 className="text-xl font-semibold">{cms.welcomeTitle}</h1>
          <p className="mt-1 text-sm text-white/70">{cms.welcomeSubtitle}</p>
        </div>
        <Link
          href="/certificates"
          className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 transition hover:bg-white/15"
        >
          <span className="text-3xl">🎓</span>
          <div>
            <div className="text-2xl font-bold leading-none">{certCount}</div>
            <div className="text-xs text-white/70">Certificates earned</div>
          </div>
        </Link>
      </div>

      <div className="rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{cms.continueLearningTitle}</h1>
          <Link href="/browse" className="text-sm font-medium text-skillBlue">
            {cms.browseLabel}
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">
            {cms.emptyLearningMessage}{" "}
            <Link href="/browse" className="text-skillBlue hover:underline">
              {cms.browseLabel}
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(({ course }) => {
              const total = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
              const done = doneByCourse.get(course.id) || 0;
              const progress = total ? Math.round((done / total) * 100) : 0;

              return (
                <Link
                  key={course.id}
                  href={`/learn/${course.id}`}
                  className="rounded-xl border border-gray-200 p-4 transition hover:shadow-md"
                >
                  <h3 className="font-semibold leading-snug">{course.title}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {done}/{total} lessons
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-skillGreen"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="w-full xl:w-2/3">
          <div className="h-full rounded-md bg-white p-4">
            <h1 className="text-xl font-semibold">{cms.scheduleTitle}</h1>
            {classItem[0] ? (
              <BigCalendarContainer type="classId" id={classItem[0].id} date={searchParams.date} />
            ) : (
              <p className="mt-4 text-sm text-gray-400">{cms.scheduleEmptyMessage}</p>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-8 xl:w-1/3">
          {session?.username && <CopyParentInvite studentUsername={session.username} />}
          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
