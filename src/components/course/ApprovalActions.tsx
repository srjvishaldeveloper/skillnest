"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  approveCourse,
  rejectCourse,
  unpublishCourse,
} from "@/lib/courseActions";

export default function ApprovalActions({
  courseId,
  live = false,
}: {
  courseId: number;
  live?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  if (live) {
    return (
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await unpublishCourse(courseId);
            toast.success("Course taken offline");
            router.refresh();
          })
        }
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-50"
      >
        Unpublish
      </button>
    );
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Reason for rejection (sent to instructor)"
          className="rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-red-400"
        />
        <div className="flex gap-2">
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await rejectCourse(courseId, reason);
                toast.success("Course rejected");
                router.refresh();
              })
            }
            className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Confirm Reject
          </button>
          <button
            onClick={() => setRejecting(false)}
            className="text-xs text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await approveCourse(courseId);
            toast.success("Course approved & published");
            router.refresh();
          })
        }
        className="rounded-md bg-skillGreen px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => setRejecting(true)}
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500"
      >
        Reject
      </button>
    </div>
  );
}
