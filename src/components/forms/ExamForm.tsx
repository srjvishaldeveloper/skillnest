"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  examSchema,
  ExamSchema,
} from "@/lib/formValidationSchemas";
import {
  createExam,
  updateExam,
} from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ExamForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
  });

  const [pdfUrl, setPdfUrl] = useState(data?.pdfUrl || "");
  const [pdfMode, setPdfMode] = useState<"upload" | "type">(data?.pdfUrl ? "type" : "upload");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // AFTER REACT 19 IT'LL BE USEACTIONSTATE

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Assessment has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF size under 50MB required");
      return;
    }

    try {
      setUploadingPdf(true);
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload?folder=pdfs", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setPdfUrl(data.url);
      setValue("pdfUrl", data.url);
      toast.success("PDF uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  const { lessons } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new assessment" : "Update the assessment"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Assessment title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Date"
          name="startTime"
          defaultValue={data?.startTime}
          register={register}
          error={errors?.startTime}
          type="datetime-local"
        />
        <InputField
          label="End Date"
          name="endTime"
          defaultValue={data?.endTime}
          register={register}
          error={errors?.endTime}
          type="datetime-local"
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Session</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            defaultValue={data?.teachers}
          >
            {lessons.map((lesson: { id: number; name: string }) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {errors.lessonId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">PDF</label>
          <div className="flex items-center gap-2 mb-1">
            <button type="button" onClick={() => setPdfMode("upload")} className={`text-xs px-2 py-1 rounded ${pdfMode === "upload" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Upload</button>
            <button type="button" onClick={() => setPdfMode("type")} className={`text-xs px-2 py-1 rounded ${pdfMode === "type" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Write URL</button>
          </div>
          {pdfMode === "upload" ? (
            <label className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full flex items-center gap-2 cursor-pointer hover:ring-blue-400">
              <Image src="/upload.png" alt="" width={20} height={20} />
              <span className="text-xs text-gray-500">
                {uploadingPdf ? "Uploading to S3..." : pdfUrl ? "Change PDF" : "Drop PDF here or click to upload"}
              </span>
              {uploadingPdf && (
                <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-auto" />
              )}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
                disabled={uploadingPdf}
              />
            </label>
          ) : (
            <input
              type="text"
              {...register("pdfUrl")}
              defaultValue={data?.pdfUrl}
              placeholder="Paste PDF URL here..."
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            />
          )}
          {pdfUrl && pdfMode === "upload" && (
            <span className="text-xs text-green-600 truncate">Uploaded: {pdfUrl}</span>
          )}
          {/* Hidden input to hold the uploaded URL for form submission */}
          <input type="hidden" {...register("pdfUrl")} value={pdfUrl} />
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Notes (optional)</label>
        <textarea
          {...register("notes")}
          defaultValue={data?.notes}
          rows={4}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        />
        {errors.notes?.message && (
          <p className="text-xs text-red-400">{errors.notes.message.toString()}</p>
        )}
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;
