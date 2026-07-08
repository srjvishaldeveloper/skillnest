"use client";

import { useEffect } from "react";
import Image from "next/image";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Unhandled root error:", error);
  }, [error]);

  const isDatabaseError =
    error.message?.toLowerCase().includes("database") ||
    error.message?.toLowerCase().includes("prisma") ||
    error.message?.toLowerCase().includes("reach database server") ||
    error.message?.toLowerCase().includes("5433") ||
    error.message?.toLowerCase().includes("connection");

  const isDiskFullError =
    error.message?.toLowerCase().includes("enospc") ||
    error.message?.toLowerCase().includes("space left") ||
    error.message?.toLowerCase().includes("write");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#12160e] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-[#a8a79c] transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#1f2419] rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-skillGreen/10 dark:bg-skillGreen/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-skillBlue/10 dark:bg-skillBlue/5 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/skillnest.png"
            alt="SkillNest Logo"
            width={140}
            height={70}
            className="object-contain h-auto"
            priority
          />
        </div>

        {/* Warning Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-500/15 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
          Something went wrong
        </h1>

        <p className="text-sm text-slate-500 dark:text-[#a8a79c]/80 mb-6 max-w-sm">
          An error occurred while loading this page. Let&apos;s get you back on track.
        </p>

        {/* Diagnostic Panel */}
        <div className="w-full text-left bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 mb-6">
          <h3 className="text-xs font-bold text-slate-400 dark:text-[#a8a79c]/50 uppercase tracking-wider mb-2">
            Possible Cause
          </h3>
          {isDatabaseError ? (
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                🔌 Database Offline / Docker Stopped
              </p>
              <p className="text-xs text-slate-500 dark:text-[#a8a79c]/70">
                It looks like Docker or the database container is stopped. Make sure your local services are running.
              </p>
              <div className="mt-3 bg-slate-200/50 dark:bg-white/5 p-2 rounded font-mono text-[11px] select-all text-slate-700 dark:text-zinc-300 border border-slate-300/30">
                docker compose up -d
              </div>
            </div>
          ) : isDiskFullError ? (
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                💾 Disk Space Full
              </p>
              <p className="text-xs text-slate-500 dark:text-[#a8a79c]/70">
                The system has run out of space (ENOSPC). Please clear some files on your disk.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                Unexpected Application Error
              </p>
              <p className="text-xs font-mono text-red-500 dark:text-red-400 break-all max-h-24 overflow-y-auto bg-red-500/5 p-2 rounded">
                {error.message || "Unknown error"}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-[#c5f82a] hover:bg-[#b0df22] text-[#04130d] font-bold py-3 px-4 rounded-xl shadow-lg shadow-[#c5f82a]/10 hover:shadow-[#c5f82a]/20 active:scale-[0.98] transition duration-200"
          >
            Try Again
          </button>

          <a
            href="/"
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-[#a8a79c] font-semibold py-3 px-4 rounded-xl text-sm transition duration-200 text-center"
          >
            Go to Home Page
          </a>
        </div>
      </div>
    </div>
  );
}
