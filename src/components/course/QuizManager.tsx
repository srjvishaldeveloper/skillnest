"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createQuiz, deleteQuiz } from "@/lib/quizActions";

type QuizT = { id: number; title: string; passingScore: number; questions: number };

export default function QuizManager({
  courseId,
  quizzes,
}: {
  courseId: number;
  quizzes: QuizT[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", passingScore: 60 });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

  const create = () => {
    if (!form.title.trim()) return;
    startTransition(async () => {
      const res = await createQuiz(
        courseId,
        form.title,
        form.description,
        Number(form.passingScore)
      );
      if (res.success) {
        toast.success("Quiz created");
        setForm({ title: "", description: "", passingScore: 60 });
        setOpen(false);
        router.push(`/courses/${courseId}/quiz/${res.quizId}`);
      } else toast.error(res.message || "Failed to create quiz");
    });
  };

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Quizzes & Assessments</h2>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md bg-skillPurple px-4 py-2 text-sm font-semibold text-white"
        >
          + New Quiz
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 rounded-md bg-skillLight p-3">
          <input
            placeholder="Quiz title (e.g. Module 1 Assessment)"
            className={input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Description (optional)"
            rows={2}
            className={input}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-xs text-gray-500">
            Passing score (%)
            <input
              type="number"
              className={`${input} w-20`}
              value={form.passingScore}
              onChange={(e) =>
                setForm({ ...form, passingScore: Number(e.target.value) })
              }
            />
          </label>
          <button
            onClick={create}
            disabled={isPending}
            className="w-max rounded-md bg-skillBlue px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Create Quiz
          </button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">
          No quizzes yet. Create one to assess your learners.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {quizzes.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2 text-sm"
            >
              <span>
                📝 {q.title}
                <span className="ml-2 text-xs text-gray-400">
                  {q.questions} questions · pass {q.passingScore}%
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Link
                  href={`/courses/${courseId}/quiz/${q.id}`}
                  className="font-medium text-skillBlue"
                >
                  Manage
                </Link>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteQuiz(q.id, courseId);
                      toast.success("Quiz deleted");
                      router.refresh();
                    })
                  }
                  className="text-xs text-red-500 hover:underline"
                >
                  delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
