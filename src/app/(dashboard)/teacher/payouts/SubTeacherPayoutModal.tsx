"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { processSubTeacherPayout, approveSubTeacherRequest } from "@/lib/payoutActions";
import { compressImage } from "@/lib/utils";

type BankDetails = {
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
} | null;

export default function SubTeacherPayoutModal({
  requestId,
  subTeacherName,
  subTeacherEmail,
  bankDetails,
  amount,
  netAmount,
  parentApproved,
  paidToSubAt,
  adminStatus,
}: {
  requestId: number;
  subTeacherName: string;
  subTeacherEmail: string | null;
  bankDetails: BankDetails;
  amount: number;
  netAmount: number;
  parentApproved: boolean;
  paidToSubAt: Date | null;
  adminStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [parentFeePct, setParentFeePct] = useState(0);
  const [editAmount, setEditAmount] = useState(netAmount);
  const [parentFeeAmount, setParentFeeAmount] = useState(0);
  const [finalNet, setFinalNet] = useState(netAmount);
  const [billUrl, setBillUrl] = useState("");
  const [uploadingBill, setUploadingBill] = useState(false);
  const [notes, setNotes] = useState("");
  const router = useRouter();

  const handleApprove = () => {
    startTransition(async () => {
      const r = await approveSubTeacherRequest(requestId);
      if (r.success) {
        toast.success("Approved request & forwarded to admin!");
        router.refresh();
      } else {
        toast.error(r.error || "Failed to approve");
      }
    });
  };

  const handleProcessTransfer = () => {
    startTransition(async () => {
      const r = await processSubTeacherPayout(requestId, {
        billUrl: billUrl || undefined,
        notes: notes || undefined,
        feePercent: parentFeePct,
        feeAmount: parentFeeAmount,
        netAmount: finalNet,
      });
      if (r.success) {
        toast.success("Payout transferred & sub-teacher notified!");
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(r.error || "Failed to process transfer");
      }
    });
  };

  const hasBank = bankDetails && (bankDetails.bankName || bankDetails.upiId);

  const subUpiId = bankDetails?.upiId;
  const subName = bankDetails?.accountHolderName || subTeacherName;
  const upiUrl = subUpiId ? `upi://pay?pa=${encodeURIComponent(subUpiId)}&pn=${encodeURIComponent(subName)}&am=${finalNet}&cu=INR&tn=${encodeURIComponent("Payout Transfer")}` : "";
  const qrCodeUrl = subUpiId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}` : "";

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {!parentApproved && (
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-md bg-skillBlue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition shadow-sm"
          >
            {isPending ? "..." : "Approve & Forward to Admin"}
          </button>
        )}

        {!paidToSubAt && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-skillGreen px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
          >
            Process & Transfer Payout
          </button>
        )}

        {paidToSubAt && (
          <span className="text-xs font-semibold text-skillGreen bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            Transferred to Sub ✓
          </span>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121214] p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Sub-Teacher Payout Transfer</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">{subTeacherName} · {subTeacherEmail}</p>

            {/* Sub-Teacher Bank Details */}
            <div className="rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3.5 mb-4 text-sm">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1.5">
                🏦 Sub-Teacher Bank Account & UPI
              </p>
              {hasBank ? (
                <div className="space-y-1 text-xs">
                  {bankDetails!.accountHolderName && (
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      Account Holder: <span className="font-bold">{bankDetails!.accountHolderName}</span>
                    </p>
                  )}
                  {bankDetails!.bankName && (
                    <p className="font-medium text-gray-800 dark:text-zinc-200">
                      Bank: {bankDetails!.bankName}{bankDetails!.accountNumber ? ` (${bankDetails!.accountNumber})` : ""}
                    </p>
                  )}
                  {bankDetails!.ifsc && (
                    <p className="font-mono text-gray-700 dark:text-zinc-300">
                      IFSC Code: {bankDetails!.ifsc}
                    </p>
                  )}
                  {bankDetails!.upiId && (
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      UPI ID: {bankDetails!.upiId}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-zinc-400 italic">No bank/UPI details provided by sub-teacher.</p>
              )}

              {/* PhonePe / UPI QR Code Card */}
              {subUpiId && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200/60 dark:border-purple-800/50 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
                  <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="PhonePe UPI QR Code" className="w-28 h-28 object-contain" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <span className="bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">PhonePe / UPI QR</span>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Scan & Pay Sub</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-300">Scan with PhonePe, GPay or Paytm to instantly pay <strong className="text-skillGreen dark:text-emerald-400">₹{finalNet}</strong></p>
                    <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                      <a href={upiUrl} className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1 rounded-md transition inline-flex items-center gap-1">
                        Pay via PhonePe / UPI App ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Parent Service Fee Breakdown */}
            <div className="rounded-lg bg-gray-50 dark:bg-[#18181B] border border-gray-200/60 dark:border-zinc-800 p-4 mb-4 text-sm">
              <p className="font-medium text-gray-900 dark:text-white mb-3">
                Transfer & Charges Breakdown <span className="text-xs text-gray-400 dark:text-zinc-400 font-normal">(cut your fee)</span>
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Gross Sub-Teacher Net</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{netAmount}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-zinc-400 text-xs w-36">Your Parent Service Fee</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={parentFeePct}
                      onChange={(e) => {
                        const pct = parseInt(e.target.value) || 0;
                        setParentFeePct(pct);
                        const fee = Math.round((netAmount * pct) / 100);
                        setParentFeeAmount(fee);
                        setFinalNet(netAmount - fee);
                      }}
                      className="w-14 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-center text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400 dark:text-zinc-400">%</span>
                    <span className="text-red-500 font-medium flex items-center gap-0.5">
                      -₹
                      <input
                        type="number"
                        value={parentFeeAmount}
                        onChange={(e) => {
                          const fee = parseInt(e.target.value) || 0;
                          setParentFeeAmount(fee);
                          setParentFeePct(netAmount > 0 ? Math.round((fee / netAmount) * 100) : 0);
                          setFinalNet(netAmount - fee);
                        }}
                        className="w-20 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-right text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-zinc-800 pt-2 mt-2 flex justify-between font-bold">
                  <span className="text-gray-900 dark:text-white">Net Paid to Sub-Teacher</span>
                  <span className="text-skillGreen dark:text-emerald-400 text-base">₹{finalNet}</span>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1 block">Upload Transfer Proof / Receipt (optional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                id="sub-bill-upload"
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
                    toast.success("Receipt uploaded successfully!");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Upload failed");
                  } finally {
                    setUploadingBill(false);
                    e.target.value = "";
                  }
                }}
              />
              <label
                htmlFor="sub-bill-upload"
                className={`ring-[1.5px] ring-gray-300 dark:ring-zinc-700 p-3 rounded-md text-sm flex items-center justify-between cursor-pointer hover:ring-blue-400 dark:hover:ring-blue-500 bg-white dark:bg-zinc-900 transition text-gray-900 dark:text-white ${uploadingBill ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {uploadingBill ? (
                    <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Image src="/upload.png" alt="" width={20} height={20} />
                  )}
                  <span className={`text-xs ${billUrl ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-gray-500 dark:text-zinc-400"}`}>
                    {uploadingBill ? "Uploading..." : billUrl ? "Receipt attached ✓" : "Upload transfer proof (PDF/image)"}
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
              <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1 block">Notes / Transaction Reference (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="ring-[1.5px] ring-gray-300 dark:ring-zinc-700 p-2.5 rounded-md text-sm w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="UPI Reference, Transaction ID, remarks..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-md border border-gray-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessTransfer}
                disabled={isPending}
                className="flex-1 rounded-md bg-skillGreen px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition shadow-sm"
              >
                {isPending ? "Processing..." : "Confirm & Mark Paid to Sub"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
