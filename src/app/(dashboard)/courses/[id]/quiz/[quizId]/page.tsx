import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import QuestionEditor from "@/components/course/QuestionEditor";

const QuizEditorPage = async ({
  params: { id, quizId },
}: {
  params: { id: string; quizId: string };
}) => {
  const session = await getSession();
  const courseId = parseInt(id);
  const qid = parseInt(quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: qid },
    include: {
      course: { select: { title: true, instructorId: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!quiz || quiz.courseId !== courseId) return notFound();
  if (session?.role === "teacher" && quiz.course.instructorId !== session.userId) {
    return notFound();
  }

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/courses" className="text-gray-400 hover:underline">
          My Courses
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/courses/${courseId}`} className="text-gray-400 hover:underline">
          {quiz.course.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">{quiz.title}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-semibold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
        <p className="mt-1 text-xs text-gray-400">
          Passing score: {quiz.passingScore}% · {quiz.questions.length} questions
        </p>
      </div>

      <QuestionEditor
        quizId={quiz.id}
        courseId={courseId}
        questions={quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        }))}
      />
    </div>
  );
};

export default QuizEditorPage;
