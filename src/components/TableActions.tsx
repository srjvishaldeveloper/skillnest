"use client";

import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export type FilterOption = {
  label: string;
  key?: string;
  value: string;
};

export type BatchOption = {
  id: number;
  name: string;
};

const TableActions = ({
  filterOptions,
  batchOptions,
}: {
  filterOptions?: FilterOption[];
  batchOptions?: BatchOption[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") || "desc";
  const currentVerified = searchParams.get("verified");
  const currentClassId = searchParams.get("classId");

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterClick = (key?: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // reset to page 1 on filter change

    if (!value || value === "") {
      if (key) params.delete(key);
      else {
        params.delete("verified");
        params.delete("classId");
      }
    } else if (key) {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const handleBatchClick = (classId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("classId", classId.toString());
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSort = currentSort === "asc" ? "desc" : "asc";
    params.set("sort", nextSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("verified");
    params.delete("classId");
    params.delete("sort");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const hasActiveFilter = !!currentVerified || !!currentClassId;

  return (
    <div className="flex items-center gap-2 relative" ref={dropdownRef}>
      {/* FILTER BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition relative ${
          hasActiveFilter ? "bg-skillBlue text-white shadow-sm" : "bg-lamaYellow hover:bg-yellow-300"
        }`}
        title="Filter options"
      >
        <Image src="/filter.png" alt="Filter" width={14} height={14} className={hasActiveFilter ? "brightness-200" : ""} />
        {hasActiveFilter && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {/* SORT BUTTON */}
      <button
        onClick={toggleSort}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-300 transition"
        title={`Sort: ${currentSort === "asc" ? "Ascending A-Z" : "Descending Z-A"}`}
      >
        <Image
          src="/sort.png"
          alt="Sort"
          width={14}
          height={14}
          className={currentSort === "asc" ? "rotate-180 transition-transform duration-200" : "transition-transform duration-200"}
        />
      </button>

      {/* FILTER DROPDOWN MENU */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl bg-white p-3 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Filters</span>
            {hasActiveFilter && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-red-500 hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
            {/* Custom Filter Options (e.g. Verified status) */}
            {filterOptions && filterOptions.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-semibold px-2">Status / Type</span>
                {filterOptions.map((opt, idx) => {
                  const isActive = opt.key
                    ? searchParams.get(opt.key) === opt.value
                    : !currentVerified;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleFilterClick(opt.key, opt.value)}
                      className={`flex items-center justify-between w-full text-left px-2 py-1.5 rounded-md text-xs transition ${
                        isActive
                          ? "bg-skillBlue/10 text-skillBlue font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Batch / Class Options */}
            {batchOptions && batchOptions.length > 0 && (
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold px-2">Batches</span>
                <button
                  onClick={() => handleFilterClick("classId", "")}
                  className={`flex items-center justify-between w-full text-left px-2 py-1.5 rounded-md text-xs transition ${
                    !currentClassId
                      ? "bg-skillBlue/10 text-skillBlue font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>All Batches</span>
                  {!currentClassId && <span>✓</span>}
                </button>
                {batchOptions.map((batch) => {
                  const isActive = currentClassId === batch.id.toString();
                  return (
                    <button
                      key={batch.id}
                      onClick={() => handleBatchClick(batch.id)}
                      className={`flex items-center justify-between w-full text-left px-2 py-1.5 rounded-md text-xs transition ${
                        isActive
                          ? "bg-skillBlue/10 text-skillBlue font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{batch.name}</span>
                      {isActive && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableActions;
