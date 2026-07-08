"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

type HoverCardProps = {
  course: {
    id: number;
    title: string;
    description: string;
    category: string;
    level: string;
    price: number;
    img?: string | null;
    outcomes: string[];
    instructor: { name: string };
    reviews: { rating: number }[];
    _count: { enrollments: number; modules: number };
  };
  enrolled: boolean;
  wishlisted: boolean;
  inCart: boolean;
  isStudent: boolean;
  children: React.ReactNode;
};

const Stars = ({ value }: { value: number }) => (
  <span className="text-skillYellow text-xs">
    {"★".repeat(Math.round(value))}
    <span className="text-gray-300">{"★".repeat(5 - Math.round(value))}</span>
  </span>
);

export default function CourseHoverCard({
  course,
  enrolled,
  children,
}: HoverCardProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("right");
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ratingAvg = course.reviews.length
    ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
    : 0;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Determine left/right placement based on position in viewport
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    setPosition(spaceRight < 340 ? "left" : "right");
    timeoutRef.current = setTimeout(() => setVisible(true), 150);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  const displayedOutcomes = course.outcomes.slice(0, 4);

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Hover Popup Card */}
      <div
        className={`
          pointer-events-none absolute top-0 z-50 w-80 rounded-2xl border border-gray-200/80 bg-white shadow-2xl ring-1 ring-black/5
          dark:border-white/10 dark:bg-[#1a1d2e] dark:shadow-black/60
          transition-all duration-200
          ${position === "right" ? "left-[calc(100%+12px)]" : "right-[calc(100%+12px)]"}
          ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"}
          ${visible ? "pointer-events-auto" : ""}
        `}
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(true);
        }}
        onMouseLeave={handleMouseLeave}
      >
        {/* Animated shimmer gradient top bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-skillBlue via-skillPurple to-skillGreen animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%]" />
        </div>

        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-sm leading-snug text-gray-900 dark:text-white line-clamp-3">
            {course.title}
          </h3>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-skillPurple/30 bg-skillPurple/10 px-2 py-0.5 text-[10px] font-semibold text-skillPurple">
              {course.category}
            </span>
            <span className="rounded-full border border-skillBlue/30 bg-skillBlue/10 px-2 py-0.5 text-[10px] font-semibold text-skillBlue">
              {course.level}
            </span>
            {course._count.enrollments > 0 && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                👥 {course._count.enrollments} students
              </span>
            )}
          </div>

          {/* Rating row */}
          {course.reviews.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Stars value={ratingAvg} />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{ratingAvg.toFixed(1)}</span>
              <span className="text-gray-400">({course.reviews.length} reviews)</span>
            </div>
          )}

          {/* Short description */}
          {course.description && (
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
              {course.description}
            </p>
          )}

          {/* Outcomes */}
          {displayedOutcomes.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                What you&apos;ll learn
              </p>
              {displayedOutcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 text-skillGreen text-xs">✓</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{o}</span>
                </div>
              ))}
              {course.outcomes.length > 4 && (
                <p className="text-[10px] text-gray-400 italic">
                  +{course.outcomes.length - 4} more outcomes...
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
            <span className="text-base font-bold text-skillBlue">
              {course.price > 0 ? `₹${course.price}` : "Free"}
            </span>
            <Link
              href={enrolled ? `/learn/${course.id}` : `/course/${course.id}`}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 ${
                enrolled
                  ? "bg-[#0a7a52] dark:bg-[#C5F82A] dark:text-black"
                  : "bg-skillBlue"
              }`}
            >
              {enrolled ? "Continue" : "View Course"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
