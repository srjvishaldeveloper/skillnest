"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        const msg = data.error || "Something went wrong";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      const msg = "Something went wrong. Please check your network or database.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171b12] px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-gray-400">
            If an account exists with that email, we've sent a password reset link.
          </p>
          <Link
            href="/signin"
            className="mt-5 inline-block rounded-md bg-[#c5f82a] px-5 py-2.5 text-sm font-semibold text-black"
          >
            Back to Sign In
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

        <h1 className="mt-6 text-center text-xl font-bold">Forgot password?</h1>
        <p className="mt-1 text-center text-sm text-gray-400">
          Enter your email and we'll send you a reset link.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 text-center">
            {errorMessage}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <label className="text-xs text-gray-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-[#c5f82a] p-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Remember your password?{" "}
          <Link href="/signin" className="font-medium text-[#c5f82a] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
