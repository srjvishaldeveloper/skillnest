"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  createModule,
  createLesson,
  deleteModule,
  deleteLesson,
  submitForReview,
  markCourseCompleted,
} from "@/lib/courseActions";

type Lesson = {
  id: number;
  title: string;
  videoUrl: string | null;
  duration: number;
  isPreview: boolean;
  content: string;
};
type ModuleT = { id: number; title: string; lessons: Lesson[] };
type Course = {
  id: number;
  title: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  reviewNote?: string | null;
  courseCompleted: boolean;
  modules: ModuleT[];
};

const STATUS_UI: Record<
  Course["status"],
  { label: string; cls: string }
> = {
  DRAFT: { label: "Draft", cls: "bg-gray-200 text-gray-600" },
  PENDING: { label: "Pending review", cls: "bg-skillYellow/20 text-skillYellow" },
  PUBLISHED: { label: "Published · Live", cls: "bg-skillGreen/20 text-skillGreen" },
  REJECTED: { label: "Changes requested", cls: "bg-red-100 text-red-500" },
};

const noState = { success: false, error: false };

export default function CourseBuilder({ course }: { course: Course }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [moduleTitle, setModuleTitle] = useState("");
  const [openLessonFor, setOpenLessonFor] = useState<number | null>(null);

  const refresh = () => router.refresh();

  const addModule = () => {
    if (!moduleTitle.trim()) {
      toast.warning("Module title is required", { toastId: "module-title-required" });
      return;
    }
    startTransition(async () => {
      const res = await createModule(noState, {
        title: moduleTitle,
        courseId: course.id,
      });
      if (res.success) {
        setModuleTitle("");
        toast.success("Module added", { toastId: "module-added" });
        refresh();
      } else toast.error("Failed to add module", { toastId: "failed-add-module" });
    });
  };

  const submit = () => {
    startTransition(async () => {
      const res = await submitForReview(course.id);
      if (res.success) {
        toast.success("Submitted for admin review", { toastId: "submitted-review" });
        refresh();
      } else toast.error(res.message || "Could not submit", { toastId: "failed-submit" });
    });
  };

  const markComplete = () => {
    if (
      !window.confirm(
        "Are you sure you want to mark this course as completed? Once completed, certificates will automatically be generated for students who finish all lessons."
      )
    )
      return;
    startTransition(async () => {
      const res = await markCourseCompleted(course.id);
      if (res.success) {
        toast.success("Course marked as completed successfully!", {
          toastId: "course-completed-success",
        });
        refresh();
      } else {
        toast.error("Failed to mark course as completed.", {
          toastId: "course-completed-failed",
        });
      }
    });
  };

  const canSubmit = course.status === "DRAFT" || course.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      {/* status bar */}
      <div className="flex flex-col gap-2 rounded-xl bg-skillLight p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-sm font-medium">Status: </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_UI[course.status].cls}`}
              >
                {STATUS_UI[course.status].label}
              </span>
            </div>
            {course.courseCompleted && (
              <span className="rounded-full bg-skillGreen/20 px-2 py-0.5 text-xs font-semibold text-skillGreen">
                ✓ Finalized (Certificates Active)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!course.courseCompleted && (
              <button
                onClick={markComplete}
                disabled={isPending}
                className="rounded-md bg-skillPurple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-skillPurple/90"
              >
                Mark Course as Completed
              </button>
            )}
            {canSubmit ? (
              <button
                onClick={submit}
                disabled={isPending}
                className="rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Submit for Review
              </button>
            ) : course.status === "PENDING" ? (
              <span className="text-xs text-gray-500">Awaiting admin approval…</span>
            ) : null}
          </div>
        </div>
        {course.status === "REJECTED" && course.reviewNote && (
          <p className="rounded-md bg-red-50 p-2 text-xs text-red-500">
            <b>Admin feedback:</b> {course.reviewNote}
          </p>
        )}
      </div>

      {/* add module */}
      <div className="flex gap-2">
        <input
          value={moduleTitle}
          onChange={(e) => setModuleTitle(e.target.value)}
          disabled={isPending}
          placeholder={isPending ? "Adding module..." : "New module title (e.g. Getting Started)"}
          className="flex-1 rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue disabled:opacity-60"
        />
        <button
          onClick={addModule}
          disabled={isPending}
          className="rounded-md bg-skillPurple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 min-w-[120px] flex items-center justify-center"
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            "+ Add Module"
          )}
        </button>
      </div>

      {/* curriculum */}
      {course.modules.length === 0 && (
        <p className="text-sm text-gray-400">
          No modules yet. Add your first module above to start building the curriculum.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {course.modules.map((m, i) => (
          <div key={m.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {i + 1}. {m.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setOpenLessonFor(openLessonFor === m.id ? null : m.id)
                  }
                  className="rounded-md bg-skillBlue px-3 py-1 text-xs font-medium text-white"
                >
                  + Lesson
                </button>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteModule(m.id, course.id);
                      toast.success("Module deleted", { toastId: "module-deleted" });
                      refresh();
                    })
                  }
                  className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* lessons */}
            <ul className="mt-3 flex flex-col gap-2">
              {m.lessons.map((l, j) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {i + 1}.{j + 1}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {l.videoUrl ? "🎬" : "📄"} {l.title}
                      </span>
                      {l.isPreview && (
                        <span className="rounded-full bg-skillGreen/20 px-2 text-[10px] text-skillGreen">
                          Free Preview
                        </span>
                      )}
                      {l.duration > 0 && (
                        <span className="text-xs text-gray-400">{l.duration}m</span>
                      )}
                    </div>
                    {l.content && (
                      <p className="pl-6 text-xs text-gray-500 italic max-w-lg whitespace-pre-line">
                        {l.content}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await deleteLesson(l.id, course.id);
                        refresh();
                      })
                    }
                    className="text-xs text-red-500 hover:underline"
                  >
                    remove
                  </button>
                </li>
              ))}
              {m.lessons.length === 0 && (
                <li className="text-xs text-gray-400">No lessons in this module yet.</li>
              )}
            </ul>

            {openLessonFor === m.id && (
              <AddLessonForm
                moduleId={m.id}
                courseId={course.id}
                onDone={() => {
                  setOpenLessonFor(null);
                  refresh();
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddLessonForm({
  moduleId,
  courseId,
  onDone,
}: {
  moduleId: number;
  courseId: number;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [compressingProgress, setCompressingProgress] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [form, setForm] = useState({
    title: "",
    videoUrl: "",
    pdfUrl: "",
    content: "",
    duration: "",
    isPreview: false,
  });

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

  const uploadFile = async (
    file: File,
    folder: string,
    setUploading: (v: boolean) => void,
    field: "videoUrl" | "pdfUrl"
  ) => {
    if (file.size > 500 * 1024 * 1024) {
      const { toast } = await import("react-toastify");
      toast.error("File too large (max 500MB)", { toastId: "file-too-large" });
      return;
    }
    try {
      setUploading(true);
      const { toast } = await import("react-toastify");
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/upload?folder=${folder}`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      if (data.status === "processing" && data.jobId) {
        setCompressingProgress(0);
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/upload/status/${data.jobId}`);
            const statusData = await statusRes.json();
            if (statusData.progress != null) {
              setCompressingProgress(statusData.progress);
            }
            if (statusData.status === "completed" && statusData.result?.url) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              setForm((prev) => ({ ...prev, [field]: statusData.result.url }));
              setCompressingProgress(null);
              setUploading(false);
              toast.success(`${field === "videoUrl" ? "Video" : "File"} uploaded!`, { toastId: `${field}-upload-success` });
            } else if (statusData.status === "failed") {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              setCompressingProgress(null);
              setUploading(false);
              toast.error(statusData.error || "Compression failed", { toastId: "compression-failed" });
            }
          } catch {
            // polling error, will retry on next tick
          }
        }, 3000);
        return;
      }

      setForm((prev) => ({ ...prev, [field]: data.url }));
      toast.success(`${field === "videoUrl" ? "Video" : "PDF"} uploaded!`, { toastId: `${field}-upload-success` });
    } catch (err) {
      const { toast } = await import("react-toastify");
      toast.error(err instanceof Error ? err.message : "Upload failed", { toastId: "upload-failed" });
    } finally {
      if (!pollingRef.current) {
        setUploading(false);
      }
    }
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.warning("Lesson title is required", { toastId: "lesson-title-required" });
      return;
    }
    startTransition(async () => {
      const res = await createLesson(
        { success: false, error: false },
        {
          title: form.title,
          videoUrl: form.videoUrl,
          pdfUrl: form.pdfUrl,
          content: form.content,
          duration: form.duration ? Number(form.duration) : 0,
          isPreview: form.isPreview,
          moduleId,
        }
      );
      if (res.success) {
        toast.success("Lesson added", { toastId: "lesson-added" });
        onDone();
      } else toast.error("Failed to add lesson", { toastId: "failed-add-lesson" });
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-md bg-skillLight p-3">
      <input
        placeholder="Lesson title"
        className={input}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <input
            placeholder="Video URL (YouTube/MP4) or upload below"
            className={`${input} flex-1`}
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
          <p className="text-[10px] text-gray-400">
            💡 Supports YouTube, Vimeo, or direct video URLs (e.g. S3 MP4 links).
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="text-xs px-2 py-1 rounded bg-skillBlue/10 text-skillBlue border border-skillBlue/20 hover:bg-skillBlue/20 transition disabled:opacity-50 flex items-center gap-1"
            >
              {uploadingVideo ? (
                <span className="w-3 h-3 border border-skillBlue border-t-transparent rounded-full animate-spin" />
              ) : "☁️"}
              {uploadingVideo
                ? compressingProgress !== null
                  ? `Compressing... ${compressingProgress}%`
                  : "Uploading..."
                : "Upload Video to S3"}
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "videos", setUploadingVideo, "videoUrl");
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <input
            placeholder="PDF URL (optional) or upload below"
            className={`${input} flex-1`}
            value={form.pdfUrl}
            onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploadingPdf}
              className="text-xs px-2 py-1 rounded bg-skillBlue/10 text-skillBlue border border-skillBlue/20 hover:bg-skillBlue/20 transition disabled:opacity-50 flex items-center gap-1"
            >
              {uploadingPdf ? (
                <span className="w-3 h-3 border border-skillBlue border-t-transparent rounded-full animate-spin" />
              ) : "📄"}
              {uploadingPdf ? "Uploading..." : "Upload PDF to S3"}
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "pdfs", setUploadingPdf, "pdfUrl");
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <input
          placeholder="Mins"
          type="number"
          className={`${input} w-20`}
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />
      </div>
      <textarea
        placeholder="Notes / text content (optional)"
        rows={2}
        className={input}
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
      />
      <label className="flex items-center gap-2 text-xs text-gray-500">
        <input
          type="checkbox"
          checked={form.isPreview}
          onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
        />
        Free preview lesson
      </label>
      <button
        onClick={submit}
        disabled={isPending || uploadingVideo || uploadingPdf}
        className="w-max rounded-md bg-skillBlue px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
      >
        {isPending ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          "Save Lesson"
        )}
      </button>
    </div>
  );
}
