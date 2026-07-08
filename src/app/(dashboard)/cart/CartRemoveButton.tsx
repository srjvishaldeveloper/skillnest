"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { removeFromCart } from "@/lib/cartActions";

export default function CartRemoveButton({ courseId }: { courseId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRemove = () =>
    startTransition(async () => {
      const r = await removeFromCart(courseId);
      if (r.success) {
        toast.info("Removed from cart");
        router.refresh();
      } else {
        toast.error(r.error || "Failed");
      }
    });

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
    >
      {isPending ? "..." : "Remove"}
    </button>
  );
}
