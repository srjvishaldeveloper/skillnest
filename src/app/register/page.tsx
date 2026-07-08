"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const RegisterPage = () => {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const initialStudent = searchParams.get("student") || "";
  const initialProfession = searchParams.get("profession") || "student";

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    sex: "MALE",
    profession: initialProfession === "parent" ? "parent" : initialProfession === "teacher" ? "teacher" : "student",
    studentUsername: initialStudent,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refCode ? { ...form, ref: refCode } : form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Welcome to SkillNest! Account created.");
        router.push(`/${data.role}`);
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171b12] px-4 py-10 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1f2419] p-8 shadow-2xl"
      >
        <Link href="/" className="flex items-center justify-center">
          <Image src="/skillnest.png" alt="SkillNest Logo" width={180} height={60} className="h-14 w-auto object-contain" priority />
        </Link>
        <p className="mt-1 text-center text-sm text-gray-400">Learn. Grow. Get Hired.</p>

        <h1 className="mt-6 text-center text-xl font-bold">Create your account</h1>
        <h2 className="text-center text-sm text-gray-400">
          {form.profession === "student"
            ? "Join as a learner and start building skills"
            : "Register as an instructor and share your knowledge"}
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={update("name")}
              className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Profession</label>
            <select
              value={form.profession}
              onChange={update("profession")}
              className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </div>

        {form.profession === "parent" && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs text-gray-400">Student Username (Required)</label>
            <input
              type="text"
              required
              value={form.studentUsername}
              onChange={update("studentUsername")}
              placeholder="Enter your child's student username"
              className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
              readOnly={!!initialStudent}
            />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2">
          <label className="text-xs text-gray-400">Username</label>
          <input
            type="text"
            required
            value={form.username}
            onChange={update("username")}
            className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Phone (for OTP login)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="10-digit mobile"
              className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Password</label>
            <div className="relative flex flex-col">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={form.password}
                onChange={update("password")}
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
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Gender</label>
            <select
              value={form.sex}
              onChange={update("sex")}
              className="rounded-md border border-white/10 bg-[#171b12] p-2 text-sm outline-none focus:border-[#c5f82a]"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-[#c5f82a] p-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-[#c5f82a] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
