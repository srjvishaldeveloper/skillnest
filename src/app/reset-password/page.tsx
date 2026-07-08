"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        toast.success("Password reset successfully!");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171b12] px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold">Invalid reset link</h1>
          <p className="mt-2 text-sm text-gray-400">This link is missing required information.</p>
          <Link href="/forgot-password" className="mt-5 inline-block rounded-md bg-[#c5f82a] px-5 py-2.5 text-sm font-semibold text-black">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171b12] px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold">Password reset!</h1>
          <p className="mt-2 text-sm text-gray-400">You can now sign in with your new password.</p>
          <Link href="/signin" className="mt-5 inline-block rounded-md bg-[#c5f82a] px-5 py-2.5 text-sm font-semibold text-black">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171b12] px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl"
      >
        <Link href="/" className="flex items-center justify-center">
          <Image src="/skillnest.png" alt="SkillNest Logo" width={180} height={60} className="h-14 w-auto object-contain" priority />
        </Link>

        <h1 className="mt-6 text-center text-xl font-bold">Set new password</h1>
        <p className="mt-1 text-center text-sm text-gray-400">Choose a strong password for your account.</p>

        <div className="mt-5 flex flex-col gap-2">
          <label className="text-xs text-gray-400">New Password</label>
          <div className="relative flex flex-col">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="rounded-md border border-white/10 bg-[#171b12] p-2 pr-10 text-sm outline-none focus:border-[#c5f82a] w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <label className="text-xs text-gray-400">Confirm Password</label>
          <div className="relative flex flex-col">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              className="rounded-md border border-white/10 bg-[#171b12] p-2 pr-10 text-sm outline-none focus:border-[#c5f82a] w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-[#c5f82a] p-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
