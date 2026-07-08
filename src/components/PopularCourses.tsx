"use client";

import { useState } from "react";
import Link from "next/link";
import CourseCardMedia from "./CourseCardMedia";

const tabs = ["Popular", "New", "Trending"];

export default function PopularCourses({ courses }: { courses: any[] }) {
  const [activeTab, setActiveTab] = useState("Popular");

  return (
    <div className="w-full">
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center rounded-full bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#635bff] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id || course.title}
            className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <button className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition hover:bg-white hover:text-red-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
            <div className="relative h-48 overflow-hidden rounded-xl">
              <CourseCardMedia
                className="h-full w-full"
                videoUrl={course.trailerUrl || course.videoUrl}
                thumbnailUrl={course.img || course.thumbnailUrl}
              />
            </div>

            <div className="flex flex-1 flex-col p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
                  {course.category || course.level || "Course"}
                </span>
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-orange-400">
                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.785 1.401 8.168L12 18.896l-7.335 3.857 1.401-8.168L.132 9.21l8.2-1.192z" />
                  </svg>
                  <span className="font-bold text-slate-900">
                    {course.rating ||
                      (course.reviews && course.reviews.length > 0
                        ? (course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.reviews.length).toFixed(1)
                        : "4.8")}
                  </span>
                  <span>
                    ({course.reviewsCount || (course.reviews ? `${course.reviews.length}` : "1.2k")})
                  </span>
                </div>
              </div>
              <Link
                href={course.id ? `/course/${course.id}` : "/explore-courses"}
                className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition group-hover:text-[#0a7a52]"
              >
                {course.title}
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                {course.instructor?.name
                  ? `By ${course.instructor.name}`
                  : course.author
                  ? `By ${course.author}`
                  : "By Instructor"}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {typeof course.price === "number"
                      ? course.price > 0
                        ? `₹${course.price}`
                        : "Free"
                      : course.price}
                  </span>
                  {"oldPrice" in course && (
                    <span className="text-sm text-slate-400 line-through">{course.oldPrice}</span>
                  )}
                </div>
                <Link
                  href={course.id ? `/course/${course.id}` : "/explore-courses"}
                  className="rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#0a7a52] hover:text-white"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href="/explore-courses"
          className="rounded-full border-2 border-slate-200 px-8 py-3 font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          View All Courses
        </Link>
      </div>
    </div>
  );
}
