"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { claimCertificate } from "@/lib/courseActions";

export default function ClaimCertificateButton({ courseId }: { courseId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await claimCertificate(courseId);
          if (res?.success) {
            toast.success("Certificate issued! 🎓");
            router.refresh();
          } else {
            toast.error("Complete all lessons to earn the certificate");
          }
        })
      }
      className="rounded-md bg-skillGreen px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      🎓 Claim Certificate
    </button>
  );
}
