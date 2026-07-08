"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { confirmManualPayment } from "@/lib/payoutActions";

export default function ConfirmButton({ orderId }: { orderId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirm = () =>
    startTransition(async () => {
      const r = await confirmManualPayment(orderId);
      if (r.success) {
        toast.success("Payment confirmed! Student enrolled.");
        router.refresh();
      } else {
        toast.error(r.error || "Failed to confirm");
      }
    });

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className="rounded-md bg-skillGreen px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
    >
      {isPending ? "Confirming..." : "Confirm ✓"}
    </button>
  );
}
