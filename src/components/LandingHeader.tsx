"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navMenu = [
  { label: "Platform", href: "/#platform" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Resources", href: "/#resources" },
  { label: "Pricing", href: "/pricing" },
  { label: "Company", href: "/company" },
];

const Logo = () => (
  <Image src="/skillnest.png" alt="SkillNest Logo" width={240} height={60} className="h-14 md:h-16 w-auto object-contain" priority />
);

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M7 17 17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function LandingHeader({ brand }: { brand: string }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-30 mx-auto max-w-7xl px-6 py-5">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-7 lg:flex">
          {navMenu.map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              {m.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/signin" className="hidden text-sm font-medium text-white/85 hover:text-white sm:block">
            Log In
          </Link>
          <Link
            href="/register"
            className="hidden items-center gap-2 rounded-xl bg-[#2ee6a6] px-5 py-2.5 text-sm font-semibold text-[#04130d] shadow-[0_8px_24px_-8px_rgba(46,230,166,0.7)] transition hover:brightness-95 sm:inline-flex"
          >
            Book a Demo <ArrowUpRight className="h-4 w-4" />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#06281d] p-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navMenu.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/5 hover:text-white"
              >
                {m.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-white/85 hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ee6a6] px-5 py-2.5 text-sm font-semibold text-[#04130d]"
            >
              Book a Demo <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
