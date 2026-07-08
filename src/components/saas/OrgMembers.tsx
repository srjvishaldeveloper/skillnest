"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { assignMemberToOrg, removeMemberFromOrg } from "@/lib/saasActions";

export function AssignMemberForm({ orgId }: { orgId: number }) {
  const [username, setUsername] = useState("");
  const [type, setType] = useState<"teacher" | "student">("student");
  const [isPending, start] = useTransition();
  const router = useRouter();
  const input =
    "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username to add"
        className={`${input} flex-1`}
      />
      <select value={type} onChange={(e) => setType(e.target.value as any)} className={input}>
        <option value="student">Learner</option>
        <option value="teacher">Instructor</option>
      </select>
      <button
        disabled={isPending}
        onClick={() =>
          start(async () => {
            const r = await assignMemberToOrg(orgId, username, type);
            if (r.success) {
              toast.success("Member added");
              setUsername("");
              router.refresh();
            } else toast.error(r.error || "Failed");
          })
        }
        className="rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Add Member
      </button>
    </div>
  );
}

export function RemoveMemberButton({
  memberId,
  type,
  orgId,
}: {
  memberId: string;
  type: "teacher" | "student";
  orgId: number;
}) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        start(async () => {
          await removeMemberFromOrg(memberId, type, orgId);
          toast.success("Removed");
          router.refresh();
        })
      }
      className="text-xs text-red-500 hover:underline"
    >
      remove
    </button>
  );
}
