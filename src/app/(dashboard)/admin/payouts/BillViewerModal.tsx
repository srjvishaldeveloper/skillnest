"use client";

import { useState } from "react";
import { X, Download, FileText } from "lucide-react";

export default function BillViewerModal({ billUrl, teacherName }: { billUrl: string; teacherName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const isPdf = billUrl.startsWith("data:application/pdf") || billUrl.toLowerCase().endsWith(".pdf");

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = billUrl;
    a.download = `Bill_${teacherName.replace(/\s+/g, "_")}_Payout.${isPdf ? "pdf" : "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-skillBlue dark:text-blue-400 font-semibold hover:underline text-xs inline-flex items-center gap-1 cursor-pointer"
      >
        <FileText className="w-3.5 h-3.5" />
        View Bill
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#121214] p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 max-h-[90vh] flex flex-col text-gray-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Uploaded Payout Bill / Receipt</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Teacher: {teacherName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-skillGreen hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Bill
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bill Preview Content */}
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200/80 dark:border-zinc-800 p-4 flex items-center justify-center min-h-[300px]">
              {isPdf ? (
                <iframe
                  src={billUrl}
                  className="w-full h-[60vh] rounded-lg border-0"
                  title="Bill PDF Preview"
                />
              ) : (
                <div className="relative max-w-full max-h-[60vh] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={billUrl}
                    alt="Payout Bill Receipt"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md border border-gray-200 dark:border-zinc-800"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
