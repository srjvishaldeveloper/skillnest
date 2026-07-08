"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { enrollCourse } from "@/lib/courseActions";
import { startCheckout, validateCoupon } from "@/lib/paymentActions";

export default function EnrollButton({
  courseId,
  price,
}: {
  courseId: number;
  price: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const router = useRouter();

  /* ---------- FREE course ---------- */
  if (price <= 0) {
    return (
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await enrollCourse(courseId);
            if (res?.success) {
              toast.success("Enrolled! Happy learning 🎉");
              router.push(`/learn/${courseId}`);
              router.refresh();
            } else toast.error(res?.message || "Could not enroll");
          })
        }
        className="w-full rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Enrolling..." : "Enroll for Free"}
      </button>
    );
  }

  /* ---------- PAID course ---------- */
  const apply = () =>
    startTransition(async () => {
      const r = await validateCoupon(coupon, courseId);
      if (r.valid && r.percentOff > 0) {
        setFinalAmount(r.finalAmount);
        toast.success(`Coupon applied — ${r.percentOff}% off`);
      } else if (r.valid) {
        toast.info("No discount on this code");
      } else {
        setFinalAmount(null);
        toast.error(r.reason);
      }
    });

  const buy = () =>
    startTransition(async () => {
      const ref =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ref") || undefined
          : undefined;
      const r = await startCheckout(courseId, coupon || undefined, ref);
      if ("url" in r && r.url) {
        window.location.href = r.url; // redirect to PhonePe
      } else if ("free" in r && r.free) {
        toast.success("Enrolled! 🎉");
        router.push(`/learn/${courseId}`);
      } else {
        toast.error(("error" in r && r.error) || "Payment failed");
      }
    });

  const shown = finalAmount ?? price;

  return (
    <div className="flex flex-col gap-2">
      <button
        disabled={isPending}
        onClick={buy}
        className="w-full rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Processing..." : `Buy Now · ₹${shown}`}
        {finalAmount != null && finalAmount !== price && (
          <span className="ml-2 text-xs line-through opacity-70">₹{price}</span>
        )}
      </button>

      {!showCoupon ? (
        <button
          onClick={() => setShowCoupon(true)}
          className="text-xs font-medium text-skillBlue"
        >
          Have a coupon?
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-skillBlue"
          />
          <button
            onClick={apply}
            disabled={isPending}
            className="rounded-md border border-skillBlue px-3 py-1.5 text-xs font-semibold text-skillBlue disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      <p className="text-center text-[10px] text-gray-400">
        🔒 Secure payment via PhonePe
      </p>
    </div>
  );
}
