"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const OtpPage = () => {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const input =
    "rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]";

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`OTP sent! Valid for ${data.expiresIn} minutes.`);
        setStep("code");
      } else toast.error(data.error || "Could not send OTP");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Signed in!");
        router.push(`/${data.role}`);
      } else toast.error(data.error || "Invalid OTP");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#171b12] px-4 text-white">
      <form
        onSubmit={step === "phone" ? requestOtp : verifyOtp}
        className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl"
      >
        <Link href="/" className="flex items-center justify-center">
          <Image src="/skillnest.png" alt="SkillNest Logo" width={180} height={60} className="h-14 w-auto object-contain" priority />
        </Link>
        <p className="mt-1 text-center text-sm text-gray-400">Learn. Grow. Get Hired.</p>

        <h1 className="mt-6 text-center text-xl font-bold">Sign in with OTP</h1>
        <h2 className="text-center text-sm text-gray-400">
          {step === "phone"
            ? "Enter your registered phone number"
            : `Enter the OTP sent to ${phone}`}
        </h2>

        {step === "phone" ? (
          <div className="mt-5 flex flex-col gap-2">
            <label className="text-xs text-gray-400">Phone number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className={input}
            />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            <label className="text-xs text-gray-400">OTP</label>
            <input
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className={`${input} tracking-[0.4em]`}
            />
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="mt-1 text-left text-xs text-gray-400 hover:text-white"
            >
              ← Change number / resend
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-[#c5f82a] p-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : step === "phone"
            ? "Send OTP"
            : "Verify & Sign In"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Prefer password?{" "}
          <Link href="/signin" className="font-medium text-[#c5f82a] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default OtpPage;
