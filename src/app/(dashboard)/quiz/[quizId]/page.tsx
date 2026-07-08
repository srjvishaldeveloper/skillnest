import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import QuizTaker from "@/components/course/QuizTaker";

const TakeQuizPage = async ({
  params: { quizId },
}: {
  params: { quizId: string };
}) => {
  const session = await getSession();
  const qid = parseInt(quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: qid },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!quiz) return notFound();

  const isStudent = session?.role === "student";

  // enrollment gate for learners
  if (isStudent) {
    const enrolled = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: session.userId, courseId: quiz.courseId },
      },
    });
    if (!enrolled) {
      return (
        <div className="m-4 mt-0 flex-1 rounded-md bg-white p-8 text-center">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enroll in <b>{quiz.course.title}</b> to take this quiz.
          </p>
          <Link
            href={`/course/${quiz.courseId}`}
            className="mt-4 inline-block rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
          >
            Go to course
          </Link>
        </div>
      );
    }
  }

  // attempt history
  const attempts = isStudent
    ? await prisma.quizAttempt.findMany({
        where: { quizId: qid, studentId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  const best = attempts.reduce(
    (b, a) => Math.max(b, Math.round((a.score / Math.max(1, a.total)) * 100)),
    0
  );

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex-1">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link
            href={`/learn/${quiz.courseId}`}
            className="text-gray-400 hover:underline"
          >
            {quiz.course.title}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium">{quiz.title}</span>
        </div>

        <div className="mb-4 rounded-xl bg-skillDark p-5 text-white">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="mt-1 text-sm text-white/70">{quiz.description}</p>
          )}
          <p className="mt-2 text-xs text-white/60">
            {quiz.questions.length} questions · passing score {quiz.passingScore}%
          </p>
        </div>

        {quiz.questions.length === 0 ? (
          <p className="rounded-md bg-white p-6 text-center text-sm text-gray-400">
            This quiz has no questions yet.
          </p>
        ) : isStudent ? (
          <QuizTaker
            quizId={quiz.id}
            passingScore={quiz.passingScore}
            questions={quiz.questions.map((q) => ({
              id: q.id,
              text: q.text,
              // NOTE: isCorrect intentionally omitted — grading is server-side
              options: q.options.map((o) => ({ id: o.id, text: o.text })),
            }))}
          />
        ) : (
          <p className="rounded-md bg-white p-6 text-center text-sm text-gray-400">
            Only enrolled learners can take this quiz.
          </p>
        )}
      </div>

      {/* attempt history */}
      {isStudent && (
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl bg-white p-4">
            <h3 className="font-semibold">Your attempts</h3>
            {attempts.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">Best score: {best}%</p>
            )}
            {attempts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">No attempts yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {attempts.map((a) => {
                  const pct = Math.round((a.score / Math.max(1, a.total)) * 100);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span>
                        {a.score}/{a.total} ({pct}%)
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          a.passed
                            ? "bg-skillGreen/20 text-skillGreen"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {a.passed ? "Passed" : "Failed"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default TakeQuizPage;
