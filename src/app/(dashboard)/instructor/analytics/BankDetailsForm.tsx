"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateTeacherBankDetails } from "@/lib/payoutActions";

export default function BankDetailsForm({
  accountHolderName,
  bankName,
  accountNumber,
  ifsc,
  upiId,
}: {
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [holder, setHolder] = useState(accountHolderName || "");
  const [bank, setBank] = useState(bankName || "");
  const [acct, setAcct] = useState(accountNumber || "");
  const [code, setCode] = useState(ifsc || "");
  const [upi, setUpi] = useState(upiId || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const hasDetails = accountHolderName || bankName || accountNumber || ifsc || upiId;

  const handleSave = () =>
    startTransition(async () => {
      const r = await updateTeacherBankDetails({
        accountHolderName: holder || undefined,
        bankName: bank || undefined,
        accountNumber: acct || undefined,
        ifsc: code || undefined,
        upiId: upi || undefined,
      });
      if (r.success) {
        toast.success("Bank details saved");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(r.error || "Failed to save");
      }
    });

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-skillBlue hover:underline"
      >
        {hasDetails ? "Edit Bank Details" : "Add Bank Details"}
      </button>

      {hasDetails && !open && (
        <div className="mt-1 text-xs text-gray-500">
          {accountHolderName && <span className="font-medium text-gray-700">{accountHolderName}</span>}
          {bankName && <> · {bankName}{accountNumber ? ` (${accountNumber})` : ""}</>}
          {ifsc && <><br />IFSC: {ifsc}</>}
          {upiId && <><br />UPI: {upiId}</>}
        </div>
      )}

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Account Holder Name</label>
              <input value={holder} onChange={e => setHolder(e.target.value)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Bank Name</label>
              <input value={bank} onChange={e => setBank(e.target.value)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Account Number</label>
              <input value={acct} onChange={e => setAcct(e.target.value)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">IFSC Code</label>
              <input value={code} onChange={e => setCode(e.target.value)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">UPI ID</label>
              <input value={upi} onChange={e => setUpi(e.target.value)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={isPending} className="rounded-md bg-skillBlue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
