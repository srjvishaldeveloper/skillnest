"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createDiscussion } from "@/lib/communityActions";

export default function AskQuestionForm({ courseId }: { courseId: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

  const submit = () => {
    startTransition(async () => {
      const res = await createDiscussion(courseId, title, body);
      if (res.success) {
        toast.success("Question posted");
        setTitle("");
        setBody("");
        setOpen(false);
        router.refresh();
      } else toast.error(res.message || "Could not post");
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
      >
        + Ask a Question
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4">
      <input
        placeholder="Question title"
        className={input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Describe your question in detail..."
        rows={4}
        className={input}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Post Question
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-gray-500">
          Cancel
        </button>
      </div>
    </div>
  );
}
