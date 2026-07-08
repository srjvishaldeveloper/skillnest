"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { checkoutCart } from "@/lib/cartActions";

export default function CartCheckoutButton({ total }: { total: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCheckout = () =>
    startTransition(async () => {
      const r = await checkoutCart();
      if (r.success) {
        if (r.free) {
          toast.success("All free courses enrolled!");
          router.push("/my-learning");
        } else if (r.url) {
          window.location.href = r.url;
        }
      } else {
        toast.error(r.error || "Checkout failed");
      }
    });

  return (
    <button
      onClick={handleCheckout}
      disabled={isPending}
      className="mt-4 w-full rounded-md bg-skillBlue py-2.5 text-sm font-bold text-white hover:bg-skillBlue/90 transition disabled:opacity-50"
    >
      {isPending ? "Processing..." : total > 0 ? `Checkout · ₹${total}` : "Enroll for Free"}
    </button>
  );
}
