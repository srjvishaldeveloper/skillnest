"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { compressImage } from "@/lib/utils";

export default function ScreenshotUpload({
  merchantTxnId,
}: {
  merchantTxnId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleUpload = async (url: string) => {
    try {
      const res = await fetch("/api/payment/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantTxnId, screenshotUrl: url }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success("Screenshot uploaded! Admin will verify shortly.");
        router.refresh();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await compressImage(file);
      const body = new FormData();
      body.append("file", compressedFile);
      const res = await fetch("/api/upload?folder=screenshots", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      await handleUpload(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (done) {
    return (
      <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
        ✅ Payment screenshot uploaded. Admin will verify your payment.
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Upload Payment Screenshot
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Please upload the screenshot of your PhonePe payment as proof.
      </p>
      <label className="inline-flex items-center gap-2 rounded-md bg-skillBlue px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-skillBlue/90 transition disabled:opacity-50">
        {uploading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Image src="/upload.png" alt="" width={16} height={16} />
            Upload Screenshot
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
