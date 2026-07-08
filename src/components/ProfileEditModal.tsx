"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

import { compressImage } from "@/lib/utils";

export default function ProfileEditModal({
  username,
  role,
  currentData,
  iconOnly,
}: {
  username: string;
  role: string;
  currentData: Record<string, any>;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [isPending, startTransition] = useTransition();
  const [bigImage, setBigImage] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setForm({ ...currentData });
    }
  }, [open, currentData]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImg(true);
      const compressedFile = await compressImage(file);
      const body = new FormData();
      body.append("file", compressedFile);
      const res = await fetch("/api/upload?folder=images", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setForm((prev) => ({ ...prev, img: data.url }));
      toast.success("Photo uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  };

  const handleSave = () => {
    if (role === "teacher") {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!form.panNumber?.trim() || !panRegex.test(form.panNumber)) {
        toast.error("A valid 10-digit PAN Card Number (e.g., ABCDE1234F) is required.");
        return;
      }
      const aadharRegex = /^[0-9]{12}$/;
      if (!form.aadharNumber?.trim() || !aadharRegex.test(form.aadharNumber)) {
        toast.error("A valid 12-digit Aadhaar Card Number is required.");
        return;
      }
    }
    startTransition(async () => {
      const r = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, data: { ...form, id: currentData.id || form.id } }),
      });
      const res = await r.json();
      if (res.success) {
        toast.success("Profile updated!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    });
  };

  const fields = getFieldsForRole(role);
  const avatarSrc = form.img || currentData.img || "/avatar.png";

  return (
    <>
      {iconOnly ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-skillBlue dark:hover:text-skillGreen transition"
          title="Edit profile & photo"
        >
          <Image src="/setting.png" alt="Edit" width={14} height={14} />
          Edit Profile
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs leading-3 font-medium text-gray-800 dark:text-gray-200 hover:text-skillBlue text-left flex items-center gap-2 cursor-pointer group"
          title="Edit profile & photo"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-zinc-700 shadow-sm group-hover:border-skillBlue transition">
            <img
              src={currentData.img || "/avatar.png"}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs leading-3 font-medium text-gray-800 dark:text-[#f0f0f0] flex items-center gap-1">
              {username}
              <Image src="/setting.png" alt="" width={10} height={10} className="opacity-40 group-hover:opacity-100 transition" />
            </span>
            <span className="text-[10px] text-gray-500 dark:text-[#6b6a60] capitalize">{role}</span>
          </div>
        </button>
      )}

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0D0D0E] p-6 shadow-2xl border border-gray-100 dark:border-[#27272A] max-h-[90vh] overflow-y-auto relative text-gray-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition"
              >
                ✕
              </button>
            </div>

            {/* Profile Image Direct Postgres Upload Section */}
            {role !== "parent" && role !== "admin" && (
              <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900/80 border border-gray-200/80 dark:border-zinc-800 mb-5">
                <div
                  onClick={() => setBigImage(avatarSrc)}
                  className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 relative flex items-center justify-center shrink-0 shadow-md cursor-pointer group hover:opacity-90 transition"
                  title="Click to view full photo"
                >
                  <img
                    src={avatarSrc}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-[10px] text-white font-medium">View</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Profile Photo</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-skillBlue hover:bg-blue-600 text-xs font-semibold text-white transition shadow-sm w-fit disabled:opacity-50"
                    >
                      {uploadingImg ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Image src="/upload.png" alt="" width={14} height={14} className="brightness-200" />
                      )}
                      {uploadingImg ? "Uploading..." : "Upload Device Photo"}
                    </button>
                    {form.img && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, img: null }))}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    📐 Recommended Ratio: 1:1 · Max Size: 10MB
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  {f.key === "certificateUrl" ? (
                    <div className="space-y-2">
                      {form[f.key] ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-white">
                          <span className="truncate text-xs text-gray-500 dark:text-zinc-400">
                            {form[f.key].split("/").pop()}
                          </span>
                          <div className="flex gap-2 shrink-0">
                            <a
                              href={form[f.key]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-skillBlue dark:text-blue-400 hover:underline font-semibold"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, [f.key]: null }))}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 p-4 text-center">
                          <span className="text-xs text-gray-400 mb-2">JPEG/PNG/PDF/IMG format</span>
                          <label className="cursor-pointer rounded bg-skillBlue px-3 py-1.5 text-xs text-white hover:bg-blue-600 transition">
                            {uploadingCert ? "Uploading..." : "Upload Certificate"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              disabled={uploadingCert}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setUploadingCert(true);
                                  const body = new FormData();
                                  body.append("file", file);
                                  const res = await fetch("/api/upload?folder=uploads", { method: "POST", body });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data?.error || "Upload failed");
                                  setForm((prev) => ({ ...prev, [f.key]: data.url }));
                                  toast.success("Certificate uploaded!");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Upload failed");
                                } finally {
                                  setUploadingCert(false);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : f.type === "select" && f.options ? (
                    <select
                      value={form[f.key] || ""}
                      onChange={set(f.key)}
                      className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#18181B] px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-skillBlue"
                    >
                      <option value="" className="dark:bg-[#18181B]">Select...</option>
                      {f.options.map((o) => (
                        <option key={o} value={o} className="dark:bg-[#18181B]">{o}</option>
                      ))}
                    </select>
                  ) : f.type === "date" ? (
                    <input
                      type="date"
                      value={form[f.key] ? new Date(form[f.key]).toISOString().split("T")[0] : ""}
                      onChange={set(f.key)}
                      className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#18181B] px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-skillBlue"
                    />
                  ) : (
                    <input
                      value={form[f.key] || ""}
                      onChange={set(f.key)}
                      className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#18181B] px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-skillBlue"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 rounded-lg bg-skillBlue hover:bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 shadow-md transition"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full-screen Big Image Lightbox Modal */}
      {bigImage && mounted && createPortal(
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          onClick={() => setBigImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setBigImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold bg-white/10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              ✕
            </button>
            <img
              src={bigImage}
              alt="Profile Photo Full View"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

type FieldDef = { key: string; label: string; type: "text" | "select" | "date"; options?: string[] };

function getFieldsForRole(role: string): FieldDef[] {
  const common: FieldDef[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "address", label: "Address", type: "text" },
  ];

  if (role === "teacher") {
    return [
      { key: "accountHolderName", label: "Account Holder Name", type: "text" },
      { key: "bankName", label: "Bank Name", type: "text" },
      { key: "accountNumber", label: "Account Number", type: "text" },
      { key: "ifsc", label: "IFSC Code", type: "text" },
      { key: "upiId", label: "UPI ID", type: "text" },
      { key: "panNumber", label: "PAN Card Number", type: "text" },
      { key: "aadharNumber", label: "Aadhaar Card Number", type: "text" },
      { key: "certificateUrl", label: "Certificate Document", type: "text" },
      ...common,
      { key: "bloodType", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
      { key: "sex", label: "Gender", type: "select", options: ["MALE", "FEMALE"] },
      { key: "birthday", label: "Birthday", type: "date" },
    ];
  }

  if (role === "student") {
    return [
      ...common,
      { key: "bloodType", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
      { key: "sex", label: "Gender", type: "select", options: ["MALE", "FEMALE"] },
      { key: "birthday", label: "Birthday", type: "date" },
    ];
  }

  if (role === "parent") {
    return common;
  }

  if (role === "admin") {
    return [
      { key: "username", label: "Username", type: "text" },
    ];
  }

  return common;
}
