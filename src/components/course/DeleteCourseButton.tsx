"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { deleteCourseById } from "@/lib/courseActions";

export default function DeleteCourseButton({ courseId }: { courseId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this course? This cannot be undone.")) return;
        startTransition(async () => {
          await deleteCourseById(courseId);
          toast.success("Course deleted");
          router.push("/courses");
          router.refresh();
        });
      }}
      className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
    >
      Delete Course
    </button>
  );
}
