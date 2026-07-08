"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

export default function ShareButton({
  courseId,
  title,
  variant = "full",
}: {
  courseId: number;
  title: string;
  variant?: "icon" | "full";
}) {
  const [open, setOpen] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/course/${courseId}` : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`,
      icon: "💬",
    },
    {
      name: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: "🐦",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: "🔗",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: "✈️",
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Course link copied to clipboard!");
      setOpen(false);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="relative">
      {variant === "icon" ? (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition"
          title="Share course"
        >
          <Image src="/share.png" alt="Share" width={16} height={16} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-skillBlue hover:text-skillBlue"
        >
          <Image src="/share.png" alt="" width={16} height={16} />
          Share
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Share this course
            </p>
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              <span>📋</span> Copy Link
            </button>
            <div className="my-1 border-t border-gray-100" />
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <span>{link.icon}</span> {link.name}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
