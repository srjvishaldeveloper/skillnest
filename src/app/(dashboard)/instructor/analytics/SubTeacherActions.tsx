"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { approveSubTeacherRequest, markSubTeacherPaid } from "@/lib/payoutActions";

export default function SubTeacherActions({ requestId }: { requestId: number }) {
  return (
    <div className="flex gap-2">
      <ApproveBtn requestId={requestId} />
      <MarkPaidBtn requestId={requestId} />
    </div>
  );
}

function ApproveBtn({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const r = await approveSubTeacherRequest(requestId);
          if (r.success) { toast.success("Approved! Now visible to admin."); router.refresh(); }
          else toast.error(r.error);
        })
      }
      disabled={isPending}
      className="rounded-md bg-skillBlue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
    >
      {isPending ? "..." : "Approve & Forward to Admin"}
    </button>
  );
}

function MarkPaidBtn({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const r = await markSubTeacherPaid(requestId);
          if (r.success) { toast.success("Marked as paid to sub-teacher"); router.refresh(); }
          else toast.error(r.error);
        })
      }
      disabled={isPending}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-50"
    >
      {isPending ? "..." : "Mark Paid to Sub"}
    </button>
  );
}
