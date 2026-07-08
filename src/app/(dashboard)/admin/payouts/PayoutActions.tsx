"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { processWithdrawalRequest } from "@/lib/payoutActions";
import { compressImage } from "@/lib/utils";

type BankDetails = {
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
};

type ParentTeacherBankDetails = {
  name: string;
  email: string | null;
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
} | null;

export default function PayoutActions({
  requestId,
  teacherName,
  teacherEmail,
  bankDetails,
  parentTeacherInfo,
  amount,
  platformFee,
  netAmount,
  platformFeePercent,
}: {
  requestId: number;
  teacherName: string;
  teacherEmail: string | null;
  bankDetails: BankDetails | null;
  parentTeacherInfo?: ParentTeacherBankDetails;
  amount: number;
  platformFee: number;
  netAmount: number;
  platformFeePercent: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showProcess, setShowProcess] = useState(false);
  const [billUrl, setBillUrl] = useState("");
  const [uploadingBill, setUploadingBill] = useState(false);
  const [notes, setNotes] = useState("");
  const [editAmount, setEditAmount] = useState(amount);
  const [editFee, setEditFee] = useState(platformFee);
  const [editNet, setEditNet] = useState(netAmount);
  const [editFeePct, setEditFeePct] = useState(platformFeePercent);
  const router = useRouter();

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleProcess = (status: "PROCESSED" | "REJECTED") =>
    startTransition(async () => {
      if (status === "PROCESSED" && !billUrl) {
        toast.error("Please upload a bill/invoice first");
        return;
      }
      if (status === "REJECTED" && !rejectReason.trim()) {
        toast.error("Please provide a cancellation message for the teacher.");
        return;
      }
      const r = await processWithdrawalRequest(requestId, status, {
        billUrl: billUrl || undefined,
        notes: status === "REJECTED" ? rejectReason.trim() : (notes || undefined),
        amount: editAmount !== amount ? editAmount : undefined,
        platformFee: editFee !== platformFee ? editFee : undefined,
        netAmount: editNet !== netAmount ? editNet : undefined,
        platformFeePercent: editFeePct !== platformFeePercent ? editFeePct : undefined,
      });
      if (r.success) {
        toast.success(status === "PROCESSED" ? "Payout processed!" : "Payout cancelled & teacher notified");
        setShowProcess(false);
        setShowRejectBox(false);
        router.refresh();
      } else {
        toast.error(r.error || "Failed");
      }
    });

  const activeRecipientBank = parentTeacherInfo || bankDetails;
  const hasBank = activeRecipientBank && (activeRecipientBank.bankName || activeRecipientBank.upiId);

  const recipientUpiId = activeRecipientBank?.upiId;
  const recipientName = activeRecipientBank?.accountHolderName || (parentTeacherInfo ? parentTeacherInfo.name : teacherName);
  const upiUrl = recipientUpiId ? `upi://pay?pa=${encodeURIComponent(recipientUpiId)}&pn=${encodeURIComponent(recipientName)}&am=${editNet}&cu=INR&tn=${encodeURIComponent("Payout Transfer")}` : "";
  const qrCodeUrl = recipientUpiId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}` : "";

  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => { setShowProcess(true); setShowRejectBox(false); }} className="rounded-md bg-skillGreen px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 shadow-sm transition">
          Process
        </button>
      </div>

      {showProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowProcess(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121214] p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Process Payout</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">{teacherName} · {teacherEmail}</p>

            {/* Sub-Teacher Flow Banner */}
            {parentTeacherInfo && (
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 p-3 mb-4 text-xs text-purple-900 dark:text-purple-200">
                <p className="font-bold mb-0.5">💳 Sub-Teacher Payout Hierarchy</p>
                <p>Admin will transfer funds directly to <strong>Parent Teacher ({parentTeacherInfo.name})</strong>. Parent Teacher is responsible for disbursing payment to Sub-Teacher ({teacherName}).</p>
              </div>
            )}

            {/* Recipient Bank Details */}
            <div className="rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3.5 mb-4 text-sm">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  {parentTeacherInfo ? `🏦 Pay To: Parent Teacher (${parentTeacherInfo.name})` : "🏦 Recipient Bank Details"}
                </p>
                {parentTeacherInfo && (
                  <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200/50 dark:border-purple-500/30">
                    Parent Account
                  </span>
                )}
              </div>
              {hasBank ? (
                <div className="space-y-1 text-xs">
                  {activeRecipientBank!.accountHolderName && (
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      Account Holder: <span className="font-bold">{activeRecipientBank!.accountHolderName}</span>
                    </p>
                  )}
                  {activeRecipientBank!.bankName && (
                    <p className="font-medium text-gray-800 dark:text-zinc-200">
                      Bank: {activeRecipientBank!.bankName}{activeRecipientBank!.accountNumber ? ` (${activeRecipientBank!.accountNumber})` : ""}
                    </p>
                  )}
                  {activeRecipientBank!.ifsc && (
                    <p className="font-mono text-gray-700 dark:text-zinc-300">
                      IFSC Code: {activeRecipientBank!.ifsc}
                    </p>
                  )}
                  {activeRecipientBank!.upiId && (
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      UPI ID: {activeRecipientBank!.upiId}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-zinc-400 italic">No bank/UPI details provided.</p>
              )}

              {/* PhonePe / UPI QR Code Card */}
              {recipientUpiId && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200/60 dark:border-purple-800/50 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
                  <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="PhonePe UPI QR Code" className="w-28 h-28 object-contain" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <span className="bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">PhonePe / UPI QR</span>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Scan & Pay</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-300">Scan with PhonePe, GPay or Paytm to instantly pay <strong className="text-skillGreen dark:text-emerald-400">₹{editNet}</strong></p>
                    <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                      <a href={upiUrl} className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1 rounded-md transition inline-flex items-center gap-1">
                        Pay via PhonePe / UPI App ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!showRejectBox ? (
              <>
                {/* Editable Bill Breakdown */}
                <div className="rounded-lg bg-gray-50 dark:bg-[#18181B] border border-gray-200/60 dark:border-zinc-800 p-4 mb-4 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-3">Bill Breakdown <span className="text-xs text-gray-400 dark:text-zinc-400 font-normal">(editable)</span></p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-zinc-400 text-xs w-32">Total amount</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 dark:text-zinc-400">₹</span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => {
                            const v = parseInt(e.target.value) || 0;
                            setEditAmount(v);
                            setEditNet(v - editFee);
                          }}
                          className="w-28 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-right font-medium text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-zinc-400 text-xs w-32">Platform fee</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editFeePct}
                          onChange={e => {
                            const pct = parseInt(e.target.value) || 0;
                            setEditFeePct(pct);
                            const fee = Math.round(editAmount * pct / 100);
                            setEditFee(fee);
                            setEditNet(editAmount - fee);
                          }}
                          className="w-14 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-center text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-400 dark:text-zinc-400">%</span>
                        <span className="text-red-500 font-medium flex items-center gap-0.5">-₹
                          <input
                            type="number"
                            value={editFee}
                            onChange={e => {
                              const fee = parseInt(e.target.value) || 0;
                              setEditFee(fee);
                              setEditFeePct(editAmount > 0 ? Math.round(fee / editAmount * 100) : 0);
                              setEditNet(editAmount - fee);
                            }}
                            className="w-20 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-right text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-zinc-800 pt-2 mt-2 flex justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Net to teacher</span>
                      <span className="text-skillGreen dark:text-emerald-400">₹{editNet}</span>
                    </div>
                  </div>
                </div>

                {/* DIRECT FILE UPLOAD FIX */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1 block">Upload Bill/Invoice *</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    id="bill-upload-input"
                    className="hidden"
                    disabled={uploadingBill}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadingBill(true);
                        const compressedFile = await compressImage(file);
                        const body = new FormData();
                        body.append("file", compressedFile);
                        const res = await fetch("/api/upload?folder=payouts", { method: "POST", body });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || "Upload failed");
                        setBillUrl(data.url);
                        toast.success("Bill uploaded successfully!");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      } finally {
                        setUploadingBill(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  <label
                    htmlFor="bill-upload-input"
                    className={`ring-[1.5px] ring-gray-300 dark:ring-zinc-700 p-3 rounded-md text-sm flex items-center justify-between cursor-pointer hover:ring-blue-400 dark:hover:ring-blue-500 bg-white dark:bg-zinc-900 transition text-gray-900 dark:text-white ${uploadingBill ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {uploadingBill ? (
                        <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Image src="/upload.png" alt="" width={20} height={20} />
                      )}
                      <span className={`text-xs ${billUrl ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-gray-500 dark:text-zinc-400"}`}>
                        {uploadingBill ? "Uploading..." : billUrl ? "Bill attached ✓" : "Upload bill (PDF/image)"}
                      </span>
                    </div>
                    {billUrl && !uploadingBill && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBillUrl("");
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </label>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1 block">Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="ring-[1.5px] ring-gray-300 dark:ring-zinc-700 p-2.5 rounded-md text-sm w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Payment reference, remarks..." />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowProcess(false)} className="flex-1 rounded-md border border-gray-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition">Cancel</button>
                  <button onClick={() => handleProcess("PROCESSED")} disabled={isPending || !billUrl} className="flex-1 rounded-md bg-skillGreen px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition shadow-sm">
                    {isPending ? "Processing..." : "Mark as Paid"}
                  </button>
                </div>
                <button onClick={() => setShowRejectBox(true)} disabled={isPending} className="mt-2 w-full rounded-md border border-red-200 dark:border-red-900/50 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50">
                  Reject / Cancel Payout...
                </button>
              </>
            ) : (
              <div className="rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Cancel Payout Request</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-300 mb-3">Write a cancellation message explaining to {teacherName} why this payout is being rejected. This will be sent directly to their Notices widget.</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="ring-[1.5px] ring-red-300 dark:ring-red-900 p-2.5 rounded-md text-sm w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 mb-3"
                  placeholder="e.g., Your bank IFSC code was invalid or details did not match. Please update your bank profile and request again."
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectBox(false)} className="flex-1 rounded-md border border-gray-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-800">
                    Back
                  </button>
                  <button onClick={() => handleProcess("REJECTED")} disabled={isPending || !rejectReason.trim()} className="flex-1 rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 shadow">
                    {isPending ? "Cancelling..." : "Confirm Cancellation & Send Notice"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
