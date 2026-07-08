"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createReply } from "@/lib/communityActions";

export default function ReplyForm({
  discussionId,
  courseId,
}: {
  discussionId: number;
  courseId: number;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await createReply(discussionId, courseId, body);
      if (res.success) {
        setBody("");
        router.refresh();
      } else toast.error(res.message || "Could not reply");
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        placeholder="Write a reply..."
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue"
      />
      <button
        onClick={submit}
        disabled={isPending}
        className="w-max rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Posting..." : "Post Reply"}
      </button>
    </div>
  );
}
