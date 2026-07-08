"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { setCoursePlatformFee } from "@/lib/payoutActions";

export default function PlatformFeeInput({
  courseId,
  initialFee,
}: {
  courseId: number;
  initialFee: number;
}) {
  const [fee, setFee] = useState(initialFee);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const save = () =>
    startTransition(async () => {
      const r = await setCoursePlatformFee(courseId, fee);
      if (r.success) {
        toast.success("Platform fee updated");
        router.refresh();
      } else {
        toast.error(r.error || "Failed");
      }
    });

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">Fee:</span>
      <input
        type="number"
        value={fee}
        onChange={(e) => setFee(Number(e.target.value))}
        min={1}
        max={100}
        className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-center outline-none focus:border-blue-400"
      />
      <span className="text-xs text-gray-400">%</span>
      {fee !== initialFee && (
        <button
          onClick={save}
          disabled={isPending}
          className="text-[10px] font-semibold text-blue-600 hover:underline disabled:opacity-50"
        >
          {isPending ? "..." : "Save"}
        </button>
      )}
    </div>
  );
}
