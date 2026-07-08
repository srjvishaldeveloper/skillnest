"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const EventForm = ({
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
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createEvent : updateEvent,
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
      toast(`Event has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const classes = relatedData?.classes || [];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-bold text-gray-900">
        {type === "create" ? "Create New Event" : "Update Event"}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Event Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Time"
          name="startTime"
          defaultValue={data?.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : ""}
          register={register}
          error={errors?.startTime}
          type="datetime-local"
        />
        <InputField
          label="End Time"
          name="endTime"
          defaultValue={data?.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ""}
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

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Batch (Optional)</label>
          <select
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register("classId")}
            defaultValue={data?.classId}
          >
            <option value="">All Batches / General</option>
            {classes.map((c: { id: number; name: string }) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-700">Description</label>
        <textarea
          {...register("description")}
          defaultValue={data?.description}
          rows={3}
          placeholder="Enter event details..."
          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {errors.description?.message && (
          <p className="text-xs text-red-500">{errors.description.message.toString()}</p>
        )}
      </div>

      {state.error && (
        <span className="text-sm font-semibold text-red-500">Something went wrong!</span>
      )}

      <button
        type="submit"
        className="rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
      >
        {type === "create" ? "Create Event" : "Update Event"}
      </button>
    </form>
  );
};

export default EventForm;
