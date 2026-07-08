"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { compressImage } from "@/lib/utils";
import { courseSchema, CourseSchema } from "@/lib/formValidationSchemas";
import { createCourse, updateCourse } from "@/lib/courseActions";

const CourseForm = ({
  type,
  data,
  priceDisabled = false,
}: {
  type: "create" | "update";
  data?: any;
  priceDisabled?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CourseSchema>({
    resolver: zodResolver(courseSchema),
    defaultValues: data,
  });

  const handleGenerateDescription = async () => {
    const titleVal = watch("title");
    const categoryVal = watch("category");

    if (!titleVal || !titleVal.trim()) {
      toast.warning("Please enter a Course Title first to generate a description.", {
        toastId: "title-required-desc",
      });
      return;
    }

    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleVal, category: categoryVal }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to generate description");
      setValue("description", resData.description);
      toast.success("Description generated successfully!", {
        toastId: "desc-gen-success",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate description", {
        toastId: "desc-gen-error",
      });
    } finally {
      setGeneratingDesc(false);
    }
  };

  const currentImg = watch("img");

  const [state, formAction] = useFormState(
    type === "create" ? createCourse : updateCourse,
    { success: false, error: false }
  );

  const router = useRouter();

  const onSubmit = handleSubmit(
    (values) => {
      if (submitting || isPending) return;
      setSubmitting(true);
      startTransition(() => {
        formAction(values);
      });
    },
    (errors) => {
      const firstError = Object.values(errors)[0]?.message;
      toast.error(firstError ? String(firstError) : "Please check all required fields!");
    }
  );

  useEffect(() => {
    if (state.success) {
      toast.success(`Course ${type === "create" ? "created" : "updated"}!`);
      router.push("/courses");
      router.refresh();
    }
    if (state.error) {
      toast.error(state.message || "Something went wrong");
      setSubmitting(false);
    }
  }, [state, router, type]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImg(true);
      const compressedFile = await compressImage(file);
      const body = new FormData();
      body.append("file", compressedFile);
      const res = await fetch("/api/upload?folder=images", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setValue("img", data.url);
      toast.success("Thumbnail uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  };

  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";
  const isDisabled = submitting || isPending || isSubmitting || uploadingImg;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {data?.id && <input type="hidden" {...register("id")} defaultValue={data.id} />}

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">Course Title</label>
        <input {...register("title")} className={input} disabled={isDisabled} />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 font-medium">Description</label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={generatingDesc || isDisabled}
            className="text-xs font-semibold text-skillBlue hover:text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1 transition"
          >
            {generatingDesc ? (
              <>
                <span className="w-3 h-3 border-2 border-skillBlue border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </>
            ) : (
              "✨ Auto-generate with AI"
            )}
          </button>
        </div>
        <textarea {...register("description")} rows={4} className={input} disabled={isDisabled} />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-gray-500 font-medium">Category</label>
          <input
            {...register("category")}
            placeholder="e.g. Web Development"
            className={input}
            disabled={isDisabled}
          />
          {errors.category && (
            <p className="text-xs text-red-400">{errors.category.message}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-gray-500 font-medium">Level</label>
          <select {...register("level")} className={input} disabled={isDisabled}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-gray-500 font-medium">Price (₹)</label>
          <input type="number" {...register("price")} className={input} defaultValue={0} disabled={priceDisabled || isDisabled} />
          {errors.price && (
            <p className="text-xs text-red-400">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-gray-500 font-medium">Max Students (0 = unlimited)</label>
          <input type="number" {...register("maxStudents")} className={input} placeholder="Leave empty for unlimited" disabled={isDisabled} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-gray-500 font-medium">Course Thumbnail Image</label>
          <div className="flex items-center gap-3">
            {currentImg && (
              <div className="w-16 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                <img src={currentImg} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-zinc-700 transition disabled:opacity-50"
            >
              {uploadingImg ? (
                <span className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Image src="/upload.png" alt="" width={14} height={14} />
              )}
              {uploadingImg ? "Uploading..." : "Choose Image File"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            📐 Recommended Ratio: 16:9 · Max Size: 50MB
          </p>
          <input {...register("img")} placeholder="Or paste Image URL (https://...)" className={`${input} mt-1`} disabled={isDisabled} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-gray-500 font-medium">Trailer Video URL (optional)</label>
          <input
            {...register("trailerUrl")}
            placeholder="YouTube/Vimeo/MP4 link"
            className={input}
            disabled={isDisabled}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            💡 Supports YouTube (watch/embed links), Vimeo, or direct MP4/WebM video URLs.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">
          Learning Outcomes (one per line)
        </label>
        <textarea
          {...register("outcomes")}
          rows={4}
          placeholder={"Build real-world projects\nMaster the fundamentals\nGet job-ready"}
          className={input}
          disabled={isDisabled}
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="mt-2 w-max rounded-md bg-skillBlue px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isDisabled ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {type === "create" ? "Creating..." : "Saving..."}
          </>
        ) : (
          type === "create" ? "Create Course" : "Save Changes"
        )}
      </button>
    </form>
  );
};

export default CourseForm;
