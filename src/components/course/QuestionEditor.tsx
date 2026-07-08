"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { addQuestion, deleteQuestion } from "@/lib/quizActions";

type Q = {
  id: number;
  text: string;
  options: { id: number; text: string; isCorrect: boolean }[];
};

export default function QuestionEditor({
  quizId,
  courseId,
  questions,
}: {
  quizId: number;
  courseId: number;
  questions: Q[];
}) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

  const setCorrect = (idx: number) =>
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));

  const save = () => {
    startTransition(async () => {
      const res = await addQuestion(quizId, courseId, text, options);
      if (res.success) {
        toast.success("Question added");
        setText("");
        setOptions([
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]);
        router.refresh();
      } else toast.error(res.message || "Failed to add question");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* existing questions */}
      <div className="flex flex-col gap-3">
        {questions.length === 0 && (
          <p className="text-sm text-gray-400">No questions yet. Add your first below.</p>
        )}
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">
                {i + 1}. {q.text}
              </p>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deleteQuestion(q.id, quizId, courseId);
                    toast.success("Question removed");
                    router.refresh();
                  })
                }
                className="shrink-0 text-xs text-red-500 hover:underline"
              >
                remove
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {q.options.map((o) => (
                <li
                  key={o.id}
                  className={`flex items-center gap-2 ${
                    o.isCorrect ? "font-medium text-skillGreen" : "text-gray-600"
                  }`}
                >
                  <span>{o.isCorrect ? "✓" : "○"}</span> {o.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* add new question */}
      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <h3 className="font-semibold">Add a question</h3>
        <input
          placeholder="Question text"
          className={`${input} mt-3 w-full`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="mt-3 text-xs text-gray-500">
          Options (select the correct one):
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={o.isCorrect}
                onChange={() => setCorrect(i)}
              />
              <input
                placeholder={`Option ${i + 1}`}
                className={`${input} flex-1`}
                value={o.text}
                onChange={(e) =>
                  setOptions(
                    options.map((op, idx) =>
                      idx === i ? { ...op, text: e.target.value } : op
                    )
                  )
                }
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          disabled={isPending}
          className="mt-3 rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add Question
        </button>
      </div>
    </div>
  );
}
