"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { submitWithdrawalRequest } from "@/lib/payoutActions";

export default function WithdrawCourseButton({
  courseId,
  courseTitle,
  available,
}: {
  courseId: number;
  courseTitle: string;
  available: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleWithdraw = () =>
    startTransition(async () => {
      if (available <= 0) {
        toast.error("No earnings available to withdraw for this course");
        return;
      }
      const r = await submitWithdrawalRequest(courseId);
      if (r.success) {
        toast.success(`Withdrawal request submitted for "${courseTitle}"! Admin will process it shortly.`);
        router.refresh();
      } else {
        toast.error(r.error || "Failed to submit request");
      }
    });

  return (
    <button
      onClick={handleWithdraw}
      disabled={isPending || available <= 0}
      className="rounded bg-skillBlue px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40 hover:bg-skillBlue/90 transition"
    >
      {isPending ? "..." : available <= 0 ? "—" : "Withdraw"}
    </button>
  );
}
