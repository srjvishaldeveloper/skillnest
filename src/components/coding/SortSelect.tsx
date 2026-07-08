"use client";

export default function SortSelect({ sort }: { sort: string }) {
  return (
    <select
      defaultValue={sort}
      onChange={(e) => {
        const params = new URLSearchParams(window.location.search);
        params.set("sort", e.target.value);
        window.location.href = `?${params.toString()}`;
      }}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
    >
      <option value="newest">Newest</option>
      <option value="title">Title A-Z</option>
      <option value="difficulty">Difficulty</option>
    </select>
  );
}
