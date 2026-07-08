"use client";

import { useState } from "react";
import { getEmbedUrl, isDirectVideo, safeHref } from "@/lib/videoEmbed";

/**
 * Course-card media: shows a thumbnail (or gradient) with a play button.
 * The video only loads/plays after the user clicks — no autoplay in the grid.
 */
export default function CourseCardMedia({
  className = "",
  videoUrl,
  thumbnailUrl,
  label,
}: {
  className?: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(videoUrl || undefined);
  const direct = isDirectVideo(videoUrl || undefined);
  const hasVideo = !!embedUrl || direct;

  const base = `relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a3322] to-[#11140d] ${className}`;
  const bgStyle = thumbnailUrl
    ? {
        backgroundImage: `linear-gradient(rgba(17,20,13,0.45), rgba(17,20,13,0.7)), url(${thumbnailUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  // playing state
  if (playing && embedUrl) {
    return (
      <div className={base}>
        <iframe
          src={embedUrl}
          title={label || "Course trailer"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (playing && direct && videoUrl) {
    return (
      <div className={base}>
        <video
          src={safeHref(videoUrl)}
          autoPlay
          controls
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  // thumbnail + play button
  return (
    <button
      type="button"
      onClick={() => hasVideo && setPlaying(true)}
      className={`${base} block w-full ${hasVideo ? "cursor-pointer" : "cursor-default"}`}
      style={bgStyle}
      aria-label={hasVideo ? `Play ${label || "trailer"}` : label}
    >
      {!thumbnailUrl && (
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_30%,#c5f82a55,transparent_60%)]" />
      )}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c5f82a] text-black shadow-lg transition group-hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      {label && (
        <span className="absolute bottom-3 left-3 z-10 text-left text-xs font-medium text-white/80">
          {label}
        </span>
      )}
    </button>
  );
}
