"use client";

import { useState } from "react";

interface DimensionScore {
  score: number;
  max: number;
  reason: string;
}

interface ScoreBreakdown {
  title: DimensionScore;
  description: DimensionScore;
  outcomes: DimensionScore;
  curriculum: DimensionScore;
  categoryMatch: DimensionScore;
  trackRecord: DimensionScore & { isNewTeacher: boolean };
}

interface QualityScorePanelProps {
  score: number;
  notes: string | null;
}

export default function QualityScorePanel({ score, notes }: QualityScorePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  let breakdown: ScoreBreakdown | null = null;
  if (notes) {
    try {
      breakdown = JSON.parse(notes) as ScoreBreakdown;
    } catch (e) {
      console.error("Failed to parse quality breakdown notes", e);
    }
  }

  // Determine color theme based on score
  // >= 80: Green, 70-79: Yellow, 50-69: Orange, <50: Red
  const getScoreColorClass = (val: number) => {
    if (val >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/40";
    if (val >= 70) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/40";
    if (val >= 50) return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-900/40";
    return "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900/40";
  };

  const getBarColorClass = (val: number, max: number) => {
    const pct = (val / max) * 100;
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 70) return "bg-amber-500";
    if (pct >= 50) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-150 bg-gray-50/30 dark:border-white/5 dark:bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Auto-Quality Review:
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getScoreColorClass(
              score
            )}`}
          >
            {score} / 100 {score >= 80 ? "🚀 PASS" : "⚠️ REVIEW"}
          </span>
        </div>
        {breakdown && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
          >
            {isOpen ? "Hide Breakdown" : "View Breakdown Details"}
          </button>
        )}
      </div>

      {isOpen && breakdown && (
        <div className="mt-4 space-y-4 border-t border-gray-200/60 pt-3 dark:border-white/10">
          {/* Dimension mapping */}
          {(Object.keys(breakdown) as Array<keyof ScoreBreakdown>).map((key) => {
            if (!breakdown) return null;
            const item = breakdown[key];
            const name = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());

            const percentage = Math.round((item.score / item.max) * 100);

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {name}
                  </span>
                  <span className="font-mono font-medium text-gray-500 dark:text-gray-400">
                    {item.score} / {item.max} ({percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200/80 dark:bg-white/10">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getBarColorClass(
                      item.score,
                      item.max
                    )}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {item.reason}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
