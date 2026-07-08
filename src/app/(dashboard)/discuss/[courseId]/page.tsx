import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AskQuestionForm from "@/components/course/AskQuestionForm";

async function canParticipate(
  role: string | undefined,
  userId: string | undefined,
  courseId: number,
  instructorId: string
) {
  if (role === "admin") return true;
  if (role === "teacher") return instructorId === userId;
  if (role === "student" && userId) {
    const e = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } },
    });
    return !!e;
  }
  return false;
}

const DiscussBoardPage = async ({
  params: { courseId },
}: {
  params: { courseId: string };
}) => {
  const session = await getSession();
  const cId = parseInt(courseId);

  const course = await prisma.course.findUnique({
    where: { id: cId },
    select: { id: true, title: true, instructorId: true },
  });
  if (!course) return notFound();

  const allowed = await canParticipate(
    session?.role,
    session?.userId,
    cId,
    course.instructorId
  );

  const threads = await prisma.discussion.findMany({
    where: { courseId: cId },
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { replies: true } } },
  });

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-5">
      <div className="mb-1 flex items-center gap-2 text-sm">
        <Link href={`/learn/${cId}`} className="text-gray-400 hover:underline">
          {course.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">Discussion</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Course Q&amp;A</h1>
        {allowed && <AskQuestionForm courseId={cId} />}
      </div>

      {!allowed && (
        <p className="mt-4 rounded-md bg-skillLight p-3 text-sm text-gray-500">
          Enroll in this course to ask questions and join the discussion.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {threads.length === 0 && (
          <p className="text-sm text-gray-400">
            No questions yet. Be the first to ask!
          </p>
        )}
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/discuss/${cId}/${t.id}`}
            className="rounded-xl border border-gray-200 p-4 transition hover:border-skillBlue/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{t.title}</h3>
              {t.resolved && (
                <span className="shrink-0 rounded-full bg-skillGreen/20 px-2 py-0.5 text-[10px] font-medium text-skillGreen">
                  ✓ Resolved
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{t.body}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
              <span>
                {t.authorName}
                {t.authorRole === "teacher" && (
                  <span className="ml-1 text-skillPurple">· Instructor</span>
                )}
              </span>
              <span>💬 {t._count.replies} replies</span>
              <span>{new Intl.DateTimeFormat("en-GB").format(t.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DiscussBoardPage;
