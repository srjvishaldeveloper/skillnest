import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CourseBuilder from "@/components/course/CourseBuilder";
import CourseSkillsManager from "@/components/course/CourseSkillsManager";
import DeleteCourseButton from "@/components/course/DeleteCourseButton";
import QuizManager from "@/components/course/QuizManager";
import LiveClassManager from "@/components/course/LiveClassManager";
import FaqManager from "@/components/course/FaqManager";

const CourseBuilderPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const session = await getSession();
  const courseId = parseInt(id);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      quizzes: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { questions: true } } },
      },
      liveClasses: {
        orderBy: { scheduledAt: "desc" },
        include: { _count: { select: { attendances: true } } },
      },
      faqs: {
        orderBy: { order: "asc" },
      },
      courseSkills: {
        select: { skillSlug: true },
      },
    },
  });

  if (!course) return notFound();
  // instructors can only manage their own courses
  if (session?.role === "teacher" && course.instructorId !== session.userId) {
    return notFound();
  }

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/courses" className="text-gray-400 hover:underline">
          My Courses
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">{course.title}</span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-wide text-skillPurple">
            {course.category} · {course.level}
          </span>
          <h1 className="text-xl font-semibold">{course.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            {course.description || "No description yet."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/discuss/${course.id}`}
            className="rounded-md bg-skillPurple px-4 py-2 text-sm font-medium text-white"
          >
            💬 Q&amp;A
          </Link>
          <Link
            href={`/courses/${course.id}/edit`}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium"
          >
            Edit Details
          </Link>
          <DeleteCourseButton courseId={course.id} />
        </div>
      </div>

      <CourseBuilder
        course={{
          id: course.id,
          title: course.title,
          status: course.status,
          reviewNote: course.reviewNote,
          courseCompleted: course.courseCompleted,
          modules: course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              videoUrl: l.videoUrl,
              duration: l.duration,
              isPreview: l.isPreview,
              content: l.content,
            })),
          })),
        }}
      />

      <CourseSkillsManager
        courseId={course.id}
        initialSkills={course.courseSkills.map((cs) => cs.skillSlug)}
      />

      <QuizManager
        courseId={course.id}
        quizzes={course.quizzes.map((q) => ({
          id: q.id,
          title: q.title,
          passingScore: q.passingScore,
          questions: q._count.questions,
        }))}
      />

      <LiveClassManager
        courseId={course.id}
        liveClasses={course.liveClasses.map((l) => ({
          id: l.id,
          title: l.title,
          scheduledAt: l.scheduledAt.toISOString(),
          durationMin: l.durationMin,
          meetingUrl: l.meetingUrl,
          attendees: l._count.attendances,
        }))}
      />

      <FaqManager
        courseId={course.id}
        faqs={course.faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        }))}
      />
    </div>
  );
};

export default CourseBuilderPage;
