"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { askTutor, generateNotes } from "@/lib/aiActions";

type Msg = { role: "user" | "assistant"; content: string };

export default function AiPanel({
  courseId,
  lessons,
  configured,
}: {
  courseId: number;
  lessons: { id: number; title: string }[];
  configured: boolean;
}) {
  const [tab, setTab] = useState<"tutor" | "notes">("tutor");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [notesLesson, setNotesLesson] = useState(lessons[0]?.id ?? 0);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    startTransition(async () => {
      const res = await askTutor(courseId, history, q);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.ok ? res.text || "" : `⚠️ ${res.error}`,
        },
      ]);
    });
  };

  const makeNotes = () => {
    if (!notesLesson) return;
    setNotes("");
    startTransition(async () => {
      const res = await generateNotes(notesLesson);
      setNotes(res.ok ? res.text || "" : `⚠️ ${res.error}`);
    });
  };

  return (
    <div className="rounded-xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          🤖 AI Tutor{" "}
          <span className="ml-1 rounded-full bg-skillPurple/15 px-2 py-0.5 text-[10px] text-skillPurple">
            Beta
          </span>
        </h2>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setTab("tutor")}
            className={`rounded-full px-3 py-1 ${
              tab === "tutor" ? "bg-skillBlue text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Ask Tutor
          </button>
          <button
            onClick={() => setTab("notes")}
            className={`rounded-full px-3 py-1 ${
              tab === "notes" ? "bg-skillBlue text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            AI Notes
          </button>
        </div>
      </div>

      {!configured && (
        <p className="mt-3 rounded-md bg-skillLight p-3 text-xs text-gray-500">
          AI features are off. Add <code>ANTHROPIC_API_KEY</code> to{" "}
          <code>.env</code> to enable the tutor and AI notes.
        </p>
      )}

      {/* ---------- TUTOR ---------- */}
      {tab === "tutor" && (
        <div className="mt-3">
          <div
            ref={scrollRef}
            className="flex max-h-72 min-h-[8rem] flex-col gap-2 overflow-y-auto rounded-md bg-gray-50 p-3 text-sm"
          >
            {messages.length === 0 && (
              <p className="text-gray-400">
                Ask anything about this course — concepts, doubts, examples.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "self-end bg-skillBlue text-white"
                    : "self-start bg-white text-gray-700 ring-1 ring-gray-200"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isPending && tab === "tutor" && (
              <div className="self-start text-xs text-gray-400">Tutor is thinking…</div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={!configured || isPending}
              placeholder="Ask your doubt..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-skillBlue disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!configured || isPending}
              className="rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ---------- NOTES ---------- */}
      {tab === "notes" && (
        <div className="mt-3">
          <div className="flex gap-2">
            <select
              value={notesLesson}
              onChange={(e) => setNotesLesson(Number(e.target.value))}
              disabled={!configured}
              className="flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm outline-none focus:border-skillBlue disabled:opacity-50"
            >
              {lessons.length === 0 && <option value={0}>No lessons</option>}
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <button
              onClick={makeNotes}
              disabled={!configured || isPending || !notesLesson}
              className="rounded-md bg-skillPurple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Generating…" : "Generate Notes"}
            </button>
          </div>
          {notes && (
            <div className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              {notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
