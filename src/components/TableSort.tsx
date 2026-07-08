"use client";

import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const TableSort = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "desc";

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSort = currentSort === "asc" ? "desc" : "asc";
    params.set("sort", nextSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const isSorted = searchParams.has("sort");

  return (
    <button
      onClick={toggleSort}
      title={`Sort Order: ${currentSort.toUpperCase()}`}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 relative backdrop-blur-md ${
        isSorted
          ? "bg-black/10 dark:bg-white/15 border border-black/20 dark:border-white/30 shadow-lg"
          : "bg-gray-100/80 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 hover:bg-white/40 dark:hover:bg-zinc-800/90 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md"
      }`}
    >
      <Image
        src="/sort.png"
        alt="Sort"
        width={14}
        height={14}
        className="dark:invert dark:brightness-200 transition-transform duration-200 active:scale-95 opacity-80 hover:opacity-100"
      />
      <span className="absolute -top-1 -right-1 text-[9px] font-black bg-black dark:bg-white text-white dark:text-black px-1 rounded-full uppercase leading-none shadow-sm">
        {currentSort === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );
};

export default TableSort;
