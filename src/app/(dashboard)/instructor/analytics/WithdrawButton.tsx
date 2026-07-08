"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { submitWithdrawalRequest } from "@/lib/payoutActions";

export default function WithdrawButton({
  available,
  hasPending,
}: {
  available: number;
  hasPending: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleWithdraw = () =>
    startTransition(async () => {
      if (available <= 0) {
        toast.error("No earnings available to withdraw");
        return;
      }
      const r = await submitWithdrawalRequest();
      if (r.success) {
        toast.success("Withdrawal request submitted! Admin will process it shortly.");
        router.refresh();
      } else {
        toast.error(r.error || "Failed to submit request");
      }
    });

  return (
    <button
      onClick={handleWithdraw}
      disabled={isPending || hasPending || available <= 0}
      className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-skillBlue/90 transition"
    >
      {isPending ? "Requesting..." : hasPending ? "Request Pending" : `Withdraw ₹${available}`}
    </button>
  );
}
