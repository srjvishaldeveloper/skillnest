"use client";

import { useMemo, useRef, useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { markLessonWatched } from "@/lib/courseActions";
import { getVideoSource } from "@/lib/videoEmbed";
import Hls from "hls.js";
import EnrollButton from "@/components/course/EnrollButton";

type Lesson = {
  id: number;
  title: string;
  videoUrl: string | null;
  pdfUrl: string | null;
  content: string;
  duration: number;
  completed: boolean;
  isPreview?: boolean;
  summary: string | null;
};
type ModuleT = { id: number; title: string; lessons: Lesson[] };

function HlsPlayer({
  src,
  className,
  onEnded,
}: {
  src: string;
  className?: string;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hls: Hls | null = null;
    if (videoRef.current) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
      }
    }
    return () => { hls?.destroy(); };
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      controls
      className={className}
      onEnded={onEnded}
    >
      {Hls.isSupported() ? null : (
        <source src={src} type="application/vnd.apple.mpegurl" />
      )}
    </video>
  );
}

function isHlsUrl(url: string) {
  return /\.m3u8(\?.*)?$/i.test(url);
}

export default function CoursePlayer({
  courseId,
  title,
  modules,
  enrolled = true,
  price = 0,
}: {
  courseId: number;
  title: string;
  modules: ModuleT[];
  enrolled?: boolean;
  price?: number;
}) {
  const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // resume where left off: first incomplete lesson, else first
  const firstIncomplete = allLessons.find((l) => !l.completed) || allLessons[0];
  const [activeId, setActiveId] = useState<number | undefined>(firstIncomplete?.id);
  // optimistic local completed set so sidebar updates instantly
  const [localCompleted, setLocalCompleted] = useState<Set<number>>(
    () => new Set(allLessons.filter((l) => l.completed).map((l) => l.id))
  );

  const active = allLessons.find((l) => l.id === activeId);
  const completedCount = localCompleted.size;
  const progress = allLessons.length
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0;

  // Called when video playback ends — auto-marks lesson as watched
  const handleVideoEnded = useCallback(() => {
    if (!active || !enrolled || localCompleted.has(active.id)) return;
    // Optimistic UI update
    setLocalCompleted((prev) => new Set(Array.from(prev).concat(active.id)));
    startTransition(async () => {
      await markLessonWatched(active.id, courseId);
      router.refresh();
    });
  }, [active, courseId, enrolled, localCompleted, router]);

  const isWatched = (lessonId: number) => localCompleted.has(lessonId);

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row">
      {/* MAIN CONTENT */}
      <div className="flex-1">
        <div className="overflow-hidden rounded-xl bg-black">
          {active && !active.isPreview && !enrolled ? (
            <div className="flex aspect-video w-full flex-col items-center justify-center bg-[#111] p-6 text-center text-white">
              <span className="text-3xl mb-3">🔒</span>
              <p className="text-base font-semibold">This lesson is locked</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Enroll in this course to get full access to all lessons and materials.
              </p>
              <div className="w-full max-w-[240px]">
                <EnrollButton courseId={courseId} price={price} />
              </div>
            </div>
          ) : active?.videoUrl ? (
            (() => {
              const { src, type } = getVideoSource(active.videoUrl);

              // iframes (YouTube/Vimeo) — cannot reliably detect onEnded via postMessage
              // so we surface a manual "Mark as Watched" button only for these
              if (type === "iframe") {
                return (
                  <div className="flex flex-col">
                    <iframe
                      src={src}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    {enrolled && (
                      <button
                        disabled={isPending || isWatched(active.id)}
                        onClick={handleVideoEnded}
                        className={`mt-2 self-end rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60 transition ${
                          isWatched(active.id)
                            ? "bg-skillGreen/20 text-skillGreen cursor-default"
                            : "bg-skillBlue text-white hover:bg-skillBlue/90"
                        }`}
                      >
                        {isWatched(active.id) ? "✓ Watched" : "Mark as Watched"}
                      </button>
                    )}
                  </div>
                );
              }

              // HLS (.m3u8) — auto-complete on ended
              if (isHlsUrl(src)) {
                return (
                  <HlsPlayer
                    src={src}
                    className="aspect-video w-full"
                    onEnded={handleVideoEnded}
                  />
                );
              }

              // Direct MP4 / WebM — auto-complete on ended
              return (
                <video
                  src={src}
                  autoPlay
                  playsInline
                  controls
                  className="aspect-video w-full"
                  onEnded={handleVideoEnded}
                />
              );
            })()
          ) : (
            <div className="flex aspect-video w-full items-center justify-center text-sm text-gray-400">
              {active ? "No video — see notes below" : "Select a lesson to begin"}
            </div>
          )}
        </div>

        {active && (
          <div className="mt-4 rounded-xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              {/* Read-only status — updated automatically */}
              {enrolled && (
                <span
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    isWatched(active.id)
                      ? "bg-skillGreen/20 text-skillGreen"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isWatched(active.id)
                    ? "✓ Completed"
                    : active.videoUrl
                    ? "Watch video to complete"
                    : "📄 Study material"}
                </span>
              )}
            </div>
            {active.content && (
              <p className="mt-3 whitespace-pre-line text-sm text-gray-600">
                {active.content}
              </p>
            )}
            {active.pdfUrl && (
              <a
                href={active.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-md bg-skillPurple/10 px-4 py-2 text-sm font-medium text-skillPurple"
              >
                📄 Download resource (PDF)
              </a>
            )}
            {active.summary && (
              <div className="mt-5 rounded-xl border border-[#bff0db] bg-[#eafaf2]/40 p-4 dark:border-white/5 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-wider text-skillPurple flex items-center gap-1.5">
                  <span>✨</span> Lesson Summary (AI Generated)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {active.summary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIDEBAR — curriculum */}
      <aside className="w-full shrink-0 rounded-xl bg-white p-4 lg:w-80">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-skillGreen transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {modules.map((m, i) => (
            <div key={m.id}>
              <p className="text-xs font-semibold uppercase text-gray-400">
                {i + 1}. {m.title}
              </p>
              <ul className="mt-1 flex flex-col">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => setActiveId(l.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                        l.id === activeId ? "bg-skillLight" : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          isWatched(l.id)
                            ? "bg-skillGreen text-white"
                            : "border border-gray-300 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="flex-1 truncate">{l.title}</span>
                      {l.isPreview && (
                        <span className="rounded-full bg-skillGreen/20 px-2 py-0.5 text-[9px] text-skillGreen font-semibold shrink-0">
                          Free Preview
                        </span>
                      )}
                      {!l.isPreview && !enrolled && (
                        <span className="text-gray-400 text-xs shrink-0">🔒</span>
                      )}
                      {l.duration > 0 && (
                        <span className="text-xs text-gray-400 shrink-0">{l.duration}m</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
