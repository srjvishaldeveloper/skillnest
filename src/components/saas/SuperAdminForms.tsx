"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createOrganization, createAffiliate } from "@/lib/saasActions";

const input =
  "rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-skillBlue";

export function CreateOrgForm() {
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Organization name"
        className={`${input} flex-1`}
      />
      <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className={input}>
        <option value="FREE">FREE</option>
        <option value="PRO">PRO</option>
        <option value="ENTERPRISE">ENTERPRISE</option>
      </select>
      <button
        disabled={isPending}
        onClick={() =>
          start(async () => {
            const r = await createOrganization(name, plan);
            if (r.success) {
              toast.success("Organization created");
              setName("");
              router.refresh();
            } else toast.error(r.error || "Failed");
          })
        }
        className="rounded-md bg-skillBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Add Org
      </button>
    </div>
  );
}

export function CreateAffiliateForm() {
  const [f, setF] = useState({
    name: "",
    username: "",
    email: "",
    code: "",
    commissionRate: 20,
    password: "",
  });
  const [isPending, start] = useTransition();
  const router = useRouter();
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <input value={f.name} onChange={up("name")} placeholder="Name" className={input} />
      <input value={f.username} onChange={up("username")} placeholder="Username" className={input} />
      <input value={f.email} onChange={up("email")} placeholder="Email (optional)" className={input} />
      <input
        value={f.code}
        onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })}
        placeholder="Referral code"
        className={input}
      />
      <input
        type="number"
        value={f.commissionRate}
        onChange={(e) => setF({ ...f, commissionRate: Number(e.target.value) })}
        placeholder="Commission %"
        className={input}
      />
      <input
        type="password"
        value={f.password}
        onChange={up("password")}
        placeholder="Password"
        className={input}
      />
      <button
        disabled={isPending}
        onClick={() =>
          start(async () => {
            const r = await createAffiliate(f);
            if (r.success) {
              toast.success("Affiliate created");
              setF({ name: "", username: "", email: "", code: "", commissionRate: 20, password: "" });
              router.refresh();
            } else toast.error(r.error || "Failed");
          })
        }
        className="rounded-md bg-skillPurple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-3"
      >
        Create Affiliate
      </button>
    </div>
  );
}
