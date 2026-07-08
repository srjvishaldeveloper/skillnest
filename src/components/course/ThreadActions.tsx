"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  toggleResolved,
  deleteDiscussion,
  deleteReply,
} from "@/lib/communityActions";

export function ResolveButton({
  discussionId,
  courseId,
  resolved,
}: {
  discussionId: number;
  courseId: number;
  resolved: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleResolved(discussionId, courseId);
          router.refresh();
        })
      }
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        resolved
          ? "bg-skillGreen/20 text-skillGreen"
          : "border border-gray-300 text-gray-500"
      }`}
    >
      {resolved ? "✓ Resolved" : "Mark Resolved"}
    </button>
  );
}

export function DeleteThreadButton({
  discussionId,
  courseId,
}: {
  discussionId: number;
  courseId: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteDiscussion(discussionId, courseId);
          toast.success("Question deleted");
          router.push(`/discuss/${courseId}`);
        })
      }
      className="text-xs text-red-500 hover:underline"
    >
      delete
    </button>
  );
}

export function DeleteReplyButton({
  replyId,
  courseId,
  discussionId,
}: {
  replyId: number;
  courseId: number;
  discussionId: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteReply(replyId, courseId, discussionId);
          router.refresh();
        })
      }
      className="text-xs text-red-400 hover:underline"
    >
      remove
    </button>
  );
}
