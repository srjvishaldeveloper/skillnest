import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ReplyForm from "@/components/course/ReplyForm";
import {
  ResolveButton,
  DeleteThreadButton,
  DeleteReplyButton,
} from "@/components/course/ThreadActions";

const ThreadPage = async ({
  params: { courseId, id },
}: {
  params: { courseId: string; id: string };
}) => {
  const session = await getSession();
  const cId = parseInt(courseId);
  const dId = parseInt(id);

  const thread = await prisma.discussion.findUnique({
    where: { id: dId },
    include: {
      course: { select: { title: true, instructorId: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread || thread.courseId !== cId) return notFound();

  // participation / moderation
  let canParticipate = session?.role === "admin";
  if (session?.role === "teacher")
    canParticipate = thread.course.instructorId === session.userId;
  if (session?.role === "student" && session.userId) {
    const e = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.userId, courseId: cId } },
    });
    canParticipate = !!e;
  }
  const isInstructorOrAdmin =
    session?.role === "admin" ||
    (session?.role === "teacher" && thread.course.instructorId === session.userId);
  const canModerateThread =
    isInstructorOrAdmin || thread.authorId === session?.userId;

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href={`/discuss/${cId}`} className="text-gray-400 hover:underline">
          {thread.course.title} · Q&amp;A
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">Question</span>
      </div>

      {/* question */}
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold">{thread.title}</h1>
          <div className="flex shrink-0 items-center gap-3">
            {canModerateThread && (
              <ResolveButton
                discussionId={thread.id}
                courseId={cId}
                resolved={thread.resolved}
              />
            )}
            {canModerateThread && (
              <DeleteThreadButton discussionId={thread.id} courseId={cId} />
            )}
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{thread.body}</p>
        <div className="mt-3 text-xs text-gray-400">
          asked by {thread.authorName}
          {thread.authorRole === "teacher" && (
            <span className="ml-1 text-skillPurple">· Instructor</span>
          )}{" "}
          · {new Intl.DateTimeFormat("en-GB").format(thread.createdAt)}
        </div>
      </div>

      {/* replies */}
      <h2 className="mt-6 font-semibold">
        {thread.replies.length} {thread.replies.length === 1 ? "Reply" : "Replies"}
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {thread.replies.map((r) => {
          const canRemove =
            isInstructorOrAdmin || r.authorId === session?.userId;
          const fromInstructor = r.authorRole === "teacher";
          return (
            <div
              key={r.id}
              className={`rounded-xl border p-4 ${
                fromInstructor
                  ? "border-skillPurple/30 bg-skillPurple/5"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {r.authorName}
                  {fromInstructor && (
                    <span className="ml-2 rounded-full bg-skillPurple/20 px-2 py-0.5 text-[10px] text-skillPurple">
                      Instructor
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3 text-xs text-gray-400">
                  {new Intl.DateTimeFormat("en-GB").format(r.createdAt)}
                  {canRemove && (
                    <DeleteReplyButton
                      replyId={r.id}
                      courseId={cId}
                      discussionId={thread.id}
                    />
                  )}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{r.body}</p>
            </div>
          );
        })}
        {thread.replies.length === 0 && (
          <p className="text-sm text-gray-400">No replies yet.</p>
        )}
      </div>

      {/* reply box */}
      {canParticipate ? (
        <div className="mt-6">
          <ReplyForm discussionId={thread.id} courseId={cId} />
        </div>
      ) : (
        <p className="mt-6 rounded-md bg-skillLight p-3 text-sm text-gray-500">
          Enroll in this course to join the discussion.
        </p>
      )}
    </div>
  );
};

export default ThreadPage;
