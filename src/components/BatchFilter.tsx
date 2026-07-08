"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function BatchFilter({
  classes,
  current,
}: {
  classes: { id: number; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      className="text-sm border border-gray-300 rounded-md px-2 py-1.5 outline-none"
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set("classId", e.target.value);
        else params.delete("classId");
        params.delete("page");
        router.push(`?${params.toString()}`);
      }}
    >
      <option value="">All Batches</option>
      {classes.map((cls) => (
        <option key={cls.id} value={cls.id}>{cls.name}</option>
      ))}
    </select>
  );
}
