"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { submitQuizAttempt } from "@/lib/quizActions";

type Question = { id: number; text: string; options: { id: number; text: string }[] };
type Result = { score: number; total: number; percent: number; passed: boolean };

export default function QuizTaker({
  quizId,
  passingScore,
  questions,
}: {
  quizId: number;
  passingScore: number;
  questions: Question[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const answeredCount = Object.keys(answers).length;

  const submit = () => {
    if (answeredCount < questions.length) {
      toast.error("Please answer all questions");
      return;
    }
    startTransition(async () => {
      const res = await submitQuizAttempt(quizId, answers);
      if (res.success) {
        setResult({
          score: res.score!,
          total: res.total!,
          percent: res.percent!,
          passed: res.passed!,
        });
        router.refresh();
      } else {
        toast.error(res.message || "Could not submit");
      }
    });
  };

  if (result) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold ${
            result.passed
              ? "bg-skillGreen/20 text-skillGreen"
              : "bg-red-100 text-red-500"
          }`}
        >
          {result.percent}%
        </div>
        <h2 className="mt-4 text-xl font-bold">
          {result.passed ? "🎉 You passed!" : "Keep practicing!"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          You scored {result.score} / {result.total} (passing: {passingScore}%)
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
            className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-medium">
            {i + 1}. {q.text}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {q.options.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                  answers[String(q.id)] === o.id
                    ? "border-skillBlue bg-skillBlue/5"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[String(q.id)] === o.id}
                  onChange={() => setAnswers({ ...answers, [String(q.id)]: o.id })}
                />
                {o.text}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-skillBlue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit Quiz"}
        </button>
        <span className="text-sm text-gray-400">
          {answeredCount}/{questions.length} answered
        </span>
      </div>
    </div>
  );
}
