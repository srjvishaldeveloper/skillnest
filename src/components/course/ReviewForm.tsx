"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { addReview, deleteReview } from "@/lib/courseActions";

export default function ReviewForm({
  courseId,
  existing,
}: {
  courseId: number;
  existing?: { rating: number; comment: string } | null;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    startTransition(async () => {
      const res = await addReview(courseId, rating, comment);
      if (res?.success) {
        toast.success(existing ? "Review updated" : "Thanks for your review!");
        router.refresh();
      } else {
        toast.error(res?.message || "Could not submit review");
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h4 className="font-semibold">
        {existing ? "Your review" : "Leave a review"}
      </h4>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className={`text-2xl ${
              n <= (hover || rating) ? "text-skillYellow" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Share your experience with this course..."
        className="mt-3 w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {existing ? "Update Review" : "Submit Review"}
        </button>
        {existing && (
          <button
            onClick={() =>
              startTransition(async () => {
                await deleteReview(courseId);
                toast.success("Review removed");
                router.refresh();
              })
            }
            className="text-sm text-red-500 hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
