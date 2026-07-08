"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { resultSchema, ResultSchema } from "@/lib/formValidationSchemas";
import { createResult, updateResult } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ResultForm = ({
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
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Score has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const students = relatedData?.students || [];
  const exams = relatedData?.exams || [];
  const assignments = relatedData?.assignments || [];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-bold text-gray-900">
        {type === "create" ? "Add New Score" : "Update Score"}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Score (%)"
          name="score"
          type="number"
          defaultValue={data?.score}
          register={register}
          error={errors?.score}
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
          <label className="text-xs font-semibold text-gray-700">Learner</label>
          <select
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register("studentId")}
            defaultValue={data?.studentId}
          >
            <option value="">Select Learner</option>
            {students.map((s: { id: string; name: string }) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.studentId?.message && (
            <p className="text-xs text-red-500">{errors.studentId.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Assessment (Optional)</label>
          <select
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register("examId")}
            defaultValue={data?.examId}
          >
            <option value="">None / Select Assessment</option>
            {exams.map((e: { id: number; title: string }) => (
              <option value={e.id} key={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Project (Optional)</label>
          <select
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register("assignmentId")}
            defaultValue={data?.assignmentId}
          >
            <option value="">None / Select Project</option>
            {assignments.map((a: { id: number; title: string }) => (
              <option value={a.id} key={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <span className="text-sm font-semibold text-red-500">Something went wrong!</span>
      )}

      <button
        type="submit"
        className="rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
      >
        {type === "create" ? "Add Score" : "Update Score"}
      </button>
    </form>
  );
};

export default ResultForm;
