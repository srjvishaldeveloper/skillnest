"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlist } from "@/lib/courseActions";

export default function WishlistButton({
  courseId,
  initial,
  variant = "icon",
}: {
  courseId: number;
  initial: boolean;
  variant?: "icon" | "full";
}) {
  const [wished, setWished] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleWishlist(courseId);
      if (res?.success) {
        setWished(!!res.wishlisted);
        router.refresh();
      }
    });
  };

  if (variant === "full") {
    return (
      <button
        onClick={onClick}
        disabled={isPending}
        className={`w-full rounded-md border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          wished
            ? "border-skillPurple bg-skillPurple/10 text-skillPurple"
            : "border-gray-200 text-gray-700 hover:border-skillPurple"
        }`}
      >
        {wished ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      aria-label="Toggle wishlist"
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow disabled:opacity-50 ${
        wished ? "text-skillPurple" : "text-gray-400"
      }`}
    >
      {wished ? "♥" : "♡"}
    </button>
  );
}
