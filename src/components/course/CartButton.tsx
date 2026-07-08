"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { addToCart, removeFromCart, isInCart } from "@/lib/cartActions";

export default function CartButton({
  courseId,
  variant = "icon",
  className = "",
}: {
  courseId: number;
  variant?: "icon" | "full";
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [inCart, setInCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    isInCart(courseId).then((res) => {
      setInCart(res);
      setLoading(false);
    });
  }, [courseId]);

  const handleToggle = () =>
    startTransition(async () => {
      if (inCart) {
        const r = await removeFromCart(courseId);
        if (r.success) {
          setInCart(false);
          toast.info("Removed from cart");
          router.refresh();
        }
      } else {
        const r = await addToCart(courseId);
        if (r.success) {
          setInCart(true);
          toast.success("Added to cart");
          router.refresh();
        } else {
          toast.error(r.error || "Failed");
        }
      }
    });

  if (loading) return null;

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`p-1.5 rounded-full transition ${inCart ? "bg-skillBlue text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"} ${className}`}
        title={inCart ? "Remove from cart" : "Add to cart"}
      >
        <svg className="w-4 h-4" fill={inCart ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        inCart
          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
          : "bg-skillBlue text-white hover:bg-skillBlue/90"
      } ${className}`}
    >
      {isPending ? "..." : inCart ? "Remove from Cart" : "Add to Cart"}
    </button>
  );
}
