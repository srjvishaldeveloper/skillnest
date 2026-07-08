import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CoursePlayer from "@/components/course/CoursePlayer";
import EnrollButton from "@/components/course/EnrollButton";
import AiPanel from "@/components/course/AiPanel";
import { aiConfigured } from "@/lib/ai";

const LearnPage = async ({ params: { id } }: { params: { id: string } }) => {
  const session = await getSession();
  const courseId = parseInt(id);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true } },
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      quizzes: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { questions: true } } },
      },
      liveClasses: { orderBy: { scheduledAt: "asc" } },
    },
  });

  if (!course) return notFound();

  const isStudent = session?.role === "student";
  const isOwnerOrAdmin =
    session?.role === "admin" ||
    (session?.role === "teacher" && course.instructorId === session.userId);

  // enrollment check for learners
  let enrolled = false;
  if (isStudent) {
    const e = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: session.userId, courseId },
      },
    });
    enrolled = !!e;
  }

  // No longer hard gate learners here; we handle premium locks in the player.

  // student's completed lessons
  let completedIds: number[] = [];
  if (isStudent) {
    const progress = await prisma.lessonProgress.findMany({
      where: {
        studentId: session.userId,
        lesson: { module: { courseId } },
      },
      select: { lessonId: true },
    });
    completedIds = progress.map((p) => p.lessonId);
  }

  const modules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l) => {
      const isAccessible = enrolled || isOwnerOrAdmin || l.isPreview;
      return {
        id: l.id,
        title: l.title,
        videoUrl: isAccessible ? l.videoUrl : null,
        pdfUrl: (enrolled || isOwnerOrAdmin) ? l.pdfUrl : null,
        content: isAccessible ? l.content : "",
        duration: l.duration,
        completed: completedIds.includes(l.id),
        isPreview: l.isPreview,
        summary: isAccessible ? l.summary : null,
      };
    }),
  }));

  const hasLessons = modules.some((m) => m.lessons.length > 0);

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={isStudent ? "/my-learning" : "/courses"}
          className="text-gray-400 hover:underline"
        >
          {isStudent ? "My Learning" : "My Courses"}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">{course.title}</span>
        {isOwnerOrAdmin && (
          <span className="ml-2 rounded-full bg-skillYellow/20 px-2 py-0.5 text-[10px] text-skillYellow">
            instructor preview
          </span>
        )}
        <Link
          href={`/discuss/${course.id}`}
          className="ml-auto rounded-md bg-skillPurple px-4 py-1.5 text-xs font-semibold text-white"
        >
          💬 Course Q&amp;A
        </Link>
      </div>

      <AiPanel
        courseId={course.id}
        configured={aiConfigured()}
        lessons={course.modules.flatMap((m) =>
          m.lessons.map((l) => ({ id: l.id, title: l.title }))
        )}
      />

      {course.liveClasses.length > 0 && (
        <div className="rounded-xl bg-white p-4">
          <h2 className="font-semibold">🎥 Live Classes</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {course.liveClasses.map((l) => {
              const start = new Date(l.scheduledAt);
              const end = new Date(start.getTime() + l.durationMin * 60000);
              const now = new Date();
              const live = now >= new Date(start.getTime() - 10 * 60000) && now <= end;
              const past = now > end;
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm"
                >
                  <span>
                    🎥 {l.title}
                    <span className="ml-2 text-xs text-gray-400">
                      {start.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {l.durationMin}m
                    </span>
                    {live && (
                      <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        ● LIVE
                      </span>
                    )}
                  </span>
                  {past ? (
                    <span className="text-xs text-gray-400">Ended</span>
                  ) : (
                    <Link
                      href={`/live/${l.id}`}
                      className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white ${
                        live ? "bg-red-500" : "bg-skillPurple"
                      }`}
                    >
                      {live ? "Join Now" : "Join"}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {course.quizzes.length > 0 && (
        <div className="rounded-xl bg-white p-4">
          <h2 className="font-semibold">Quizzes & Assessments</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {course.quizzes.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2 text-sm"
              >
                <span>
                  📝 {q.title}
                  <span className="ml-2 text-xs text-gray-400">
                    {q._count.questions} questions · pass {q.passingScore}%
                  </span>
                </span>
                <Link
                  href={`/quiz/${q.id}`}
                  className="rounded-md bg-skillBlue px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Take Quiz
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasLessons ? (
        <CoursePlayer courseId={course.id} title={course.title} modules={modules} enrolled={enrolled || isOwnerOrAdmin} price={course.price} />
      ) : (
        <div className="rounded-md bg-white p-8 text-center text-sm text-gray-400">
          This course has no lessons yet. Check back soon!
        </div>
      )}
    </div>
  );
};

export default LearnPage;
