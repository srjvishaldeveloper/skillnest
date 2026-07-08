"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { scheduleLiveClass, deleteLiveClass } from "@/lib/liveActions";

type LiveT = {
  id: number;
  title: string;
  scheduledAt: string; // ISO
  durationMin: number;
  meetingUrl: string;
  attendees: number;
};

export default function LiveClassManager({
  courseId,
  liveClasses,
}: {
  courseId: number;
  liveClasses: LiveT[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", scheduledAt: "", durationMin: 60 });
  const [isPending, start] = useTransition();
  const router = useRouter();
  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

  const create = () =>
    start(async () => {
      const res = await scheduleLiveClass(
        courseId,
        form.title,
        form.scheduledAt,
        Number(form.durationMin)
      );
      if (res.success) {
        toast.success("Live class scheduled — learners notified");
        setForm({ title: "", scheduledAt: "", durationMin: 60 });
        setOpen(false);
        router.refresh();
      } else toast.error(res.error || "Failed");
    });

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">🎥 Live Classes</h2>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md bg-skillPurple px-4 py-2 text-sm font-semibold text-white"
        >
          + Schedule Live Class
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 rounded-md bg-skillLight p-3">
          <input
            placeholder="Class title (e.g. Live Doubt Session)"
            className={input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs text-gray-500">
              Date & time
              <input
                type="datetime-local"
                className={input}
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-500">
              Duration (min)
              <input
                type="number"
                className={`${input} w-28`}
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
              />
            </label>
          </div>
          <button
            onClick={create}
            disabled={isPending}
            className="w-max rounded-md bg-skillBlue px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Schedule & Notify Learners
          </button>
        </div>
      )}

      {liveClasses.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">No live classes scheduled yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {liveClasses.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm"
            >
              <span>
                🎥 {l.title}
                <span className="ml-2 text-xs text-gray-400">
                  {new Date(l.scheduledAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {l.durationMin}m · 👥 {l.attendees} attended
                </span>
              </span>
              <span className="flex items-center gap-3">
                <a
                  href={`/live/${l.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-skillBlue"
                >
                  Start
                </a>
                <button
                  onClick={() =>
                    start(async () => {
                      await deleteLiveClass(l.id, courseId);
                      toast.success("Deleted");
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
