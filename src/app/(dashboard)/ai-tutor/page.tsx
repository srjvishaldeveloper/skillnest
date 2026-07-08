import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import AiPanel from "@/components/course/AiPanel";

const AiTutorPage = async ({
  searchParams,
}: {
  searchParams: { course?: string };
}) => {
  const session = await getSession();
  if (!session) {
    return (
      <div className="m-4 mt-0 flex flex-1 items-center justify-center">
        <p className="text-gray-500">Please sign in to use the AI Tutor.</p>
      </div>
    );
  }

  let courses: { id: number; title: string; img: string | null }[] = [];

  if (session.role === "student") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.userId },
      select: {
        course: { select: { id: true, title: true, img: true } },
      },
    });
    courses = enrollments.map((e) => e.course);
  } else if (session.role === "teacher") {
    courses = await prisma.course.findMany({
      where: { instructorId: session.userId },
      select: { id: true, title: true, img: true },
    });
  } else if (session.role === "admin") {
    courses = await prisma.course.findMany({
      select: { id: true, title: true, img: true },
      take: 50,
    });
  }

  const selectedId = searchParams.course
    ? Number(searchParams.course)
    : courses[0]?.id || 0;

  const selectedCourse = courses.find((c) => c.id === selectedId);

  let lessons: { id: number; title: string }[] = [];
  if (selectedCourse) {
    const modules = await prisma.courseModule.findMany({
      where: { courseId: selectedCourse.id },
      orderBy: { order: "asc" },
      select: {
        lessons: {
          orderBy: { order: "asc" },
          select: { id: true, title: true },
        },
      },
    });
    lessons = modules.flatMap((m) => m.lessons);
  }

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">🤖 AI Tutor</h1>
        {!aiConfigured() && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-600">
            AI not configured
          </span>
        )}
      </div>

      {courses.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">
              {session.role === "student"
                ? "Enroll in a course first to use the AI Tutor."
                : "Create a course first to use the AI Tutor."}
            </p>
            <Link
              href="/browse"
              className="mt-3 inline-block rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      )}

      {courses.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Select course:</span>
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/ai-tutor?course=${c.id}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  c.id === selectedId
                    ? "bg-skillBlue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c.title}
              </Link>
            ))}
          </div>

          {selectedCourse && (
            <AiPanel
              courseId={selectedCourse.id}
              configured={aiConfigured()}
              lessons={lessons}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AiTutorPage;
