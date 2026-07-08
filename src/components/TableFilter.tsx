"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type FilterOption = { label: string; key?: string; value: string };

const TableFilter = ({
  options = [
    { label: "All Records", value: "" },
  ],
  batchOptions,
}: {
  options?: FilterOption[];
  batchOptions?: { id: number; name: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);

  const hasFilter = Array.from(searchParams.keys()).some(
    (k) => k !== "page" && k !== "search" && k !== "sort"
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.has("search")) params.set("search", searchParams.get("search")!);
    if (searchParams.has("sort")) params.set("sort", searchParams.get("sort")!);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        title="Filter Records by Criteria"
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 relative backdrop-blur-md ${
          hasFilter
            ? "bg-black/10 dark:bg-white/15 border border-black/20 dark:border-white/30 shadow-lg"
            : "bg-gray-100/80 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 hover:bg-white/40 dark:hover:bg-zinc-800/90 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md"
        }`}
      >
        <Image
          src="/filter.png"
          alt="Filter"
          width={14}
          height={14}
          className="dark:invert dark:brightness-200 transition-transform duration-200 active:scale-95 opacity-80 hover:opacity-100"
        />
        {hasFilter && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-sky-500 dark:bg-white border-2 border-white dark:border-black rounded-full shadow-sm" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-[#0D0D0E]/95 backdrop-blur-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xl p-2 z-50 text-xs animate-fadeIn">
          <div className="flex items-center justify-between px-2.5 py-2 font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/80 mb-1">
            <span>Filter By</span>
            {hasFilter && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-red-500 hover:underline capitalize"
              >
                Reset
              </button>
            )}
          </div>
          {options.map((opt, i) => {
            const filterKey = opt.key || "filter";
            const isActive = searchParams.get(filterKey) === opt.value;
            return (
              <button
                key={i}
                onClick={() => applyFilter(filterKey, opt.value)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between my-0.5 ${
                  isActive
                    ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold backdrop-blur-md"
                    : "hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span>{opt.label}</span>
                {isActive && <span className="text-black dark:text-white font-black">✓</span>}
              </button>
            );
          })}

          {batchOptions && batchOptions.length > 0 && (
            <div className="px-2.5 pt-2 mt-1 border-t border-gray-100 dark:border-zinc-800/80">
              <label className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Batch</label>
              <select
                className="w-full mt-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 outline-none bg-white dark:bg-zinc-900"
                value={searchParams.get("classId") || ""}
                onChange={(e) => applyFilter("classId", e.target.value)}
              >
                <option value="">All Batches</option>
                {batchOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableFilter;
