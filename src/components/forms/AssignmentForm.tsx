"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { assignmentSchema, AssignmentSchema } from "@/lib/formValidationSchemas";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AssignmentForm = ({
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
    formState: { errors },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
  });

  const [resourceMode, setResourceMode] = useState<"text" | "file">("text");
  const [textResource, setTextResource] = useState(data?.pdfUrl || "");
  const [fileName, setFileName] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createAssignment : updateAssignment,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction({ ...formData, pdfUrl: textResource || undefined });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Project has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const lessons = relatedData?.lessons || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size should be under 50MB");
      return;
    }

    try {
      setUploadingFile(true);
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload?folder=assignments", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setFileName(file.name);
      setTextResource(data.url);
      toast.success("File uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-bold text-gray-900">
        {type === "create" ? "Create New Project" : "Update Project"}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Project Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Date"
          name="startDate"
          defaultValue={data?.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : ""}
          register={register}
          error={errors?.startDate}
          type="datetime-local"
        />
        <InputField
          label="Due Date"
          name="dueDate"
          defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : ""}
          register={register}
          error={errors?.dueDate}
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

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Associated Session</label>
          <select
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
          >
            {lessons.map((lesson: { id: number; name: string }) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-500">{errors.lessonId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* 2 Clean Options for Resources / Instructions */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
          Project Resource / Instructions (Choose Input Method)
        </label>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setResourceMode("text")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              resourceMode === "text"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Option 1: Normal Text / URL
          </button>
          <button
            type="button"
            onClick={() => setResourceMode("file")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              resourceMode === "file"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Option 2: Choose File
          </button>
        </div>

        {resourceMode === "text" ? (
          <div>
            <textarea
              value={textResource}
              onChange={(e) => setTextResource(e.target.value)}
              placeholder="Enter project description, instructions, or paste resource URL..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploadingFile}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploadingFile && (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Uploading to S3...
              </div>
            )}
            {fileName && !uploadingFile && (
              <span className="text-xs font-medium text-emerald-600">
                ✓ Uploaded: {fileName}
              </span>
            )}
          </div>
        )}
      </div>

      {state.error && (
        <span className="text-sm font-semibold text-red-500">Something went wrong!</span>
      )}

      <button
        type="submit"
        className="rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
      >
        {type === "create" ? "Create Project" : "Update Project"}
      </button>
    </form>
  );
};

export default AssignmentForm;
