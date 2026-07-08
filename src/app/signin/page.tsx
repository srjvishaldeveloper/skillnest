"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const SignInPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/${data.role}`);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171b12] px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl"
      >
        <Link href="/" className="flex items-center justify-center">
          <Image src="/skillnest.png" alt="SkillNest Logo" width={180} height={60} className="h-14 w-auto object-contain" priority />
        </Link>
        <p className="mt-1 text-center text-sm text-gray-400">Learn. Grow. Get Hired.</p>

        <h1 className="mt-6 text-center text-xl font-bold">Welcome back</h1>
        <h2 className="text-center text-sm text-gray-400">Sign in to your account</h2>

        <div className="mt-5 flex flex-col gap-2">
          <label className="text-xs text-gray-400">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
          />
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <label className="text-xs text-gray-400">Password</label>
          <div className="relative flex flex-col">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" />
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
          {loading ? "Signing in..." : "Sign In to SkillNest"}
        </button>

        <div className="mt-3 flex items-center justify-between">
          <Link
            href="/otp"
            className="rounded-md border border-white/10 p-2 text-center text-sm font-medium text-gray-200 transition hover:border-[#c5f82a] flex-1"
          >
            📱 Sign in with OTP
          </Link>
          <Link
            href="/forgot-password"
            className="ml-2 text-xs text-gray-400 hover:text-[#c5f82a] transition"
          >
            Forgot password?
          </Link>
        </div>

        <p className="mt-4 text-center text-sm text-gray-400">
          New to SkillNest?{" "}
          <Link href="/register" className="font-medium text-[#c5f82a] hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignInPage;
