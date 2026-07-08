"use client";

import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || searchParams.get("q") || "");

  useEffect(() => {
    setQuery(searchParams.get("search") || searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = query.trim();
    if (!val) return;

    // Check if current page supports direct table/grid search filter
    const listPages = [
      "/courses",
      "/browse",
      "/explore-courses",
      "/list/teachers",
      "/list/students",
      "/list/parents",
      "/list/classes",
      "/list/subjects",
      "/list/exams",
      "/list/assignments",
      "/list/announcements",
      "/list/events",
      "/list/results",
      "/list/attendance",
    ];

    const isListPage = listPages.some((p) => pathname.startsWith(p));

    if (isListPage) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", val);
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/browse?search=${encodeURIComponent(val)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="search-bar hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 dark:ring-white/10 dark:bg-[#171b12] px-3 py-1 bg-white shadow-xs"
    >
      <Image src="/search.png" alt="Search" width={14} height={14} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses, instructors, lessons..."
        className="w-[220px] lg:w-[280px] p-1.5 bg-transparent outline-none text-gray-800 dark:text-[#f0f0f0] placeholder:text-gray-400 dark:placeholder:text-white/30 text-xs"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            if (searchParams.get("search")) {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("search");
              router.push(`${pathname}?${params.toString()}`);
            }
          }}
          className="text-gray-400 hover:text-gray-600 text-xs px-1"
        >
          ✕
        </button>
      )}
    </form>
  );
}
