"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function AvatarLightbox({
  src,
  alt = "Profile Photo",
  className = "w-36 h-36 rounded-full object-cover",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`relative cursor-pointer group hover:opacity-90 transition overflow-hidden shrink-0 ${className.includes("rounded") ? "" : "rounded-full"}`}
        title="Click to view full photo"
      >
        <img src={src} alt={alt} className={className} />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-full">
          <span className="text-xs text-white font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">View DP</span>
        </div>
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold bg-white/10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              ✕
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
