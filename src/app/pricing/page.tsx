import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing — SkillNest",
  description: "Simple, transparent pricing for teams of every size on SkillNest.",
};

import Image from "next/image";

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Logo = () => (
  <Image src="/skillnest.png" alt="SkillNest Logo" width={200} height={50} className="h-12 md:h-14 w-auto object-contain" priority />
);

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    blurb: "For individuals exploring the platform.",
    features: ["Access free courses", "Basic progress tracking", "Community support"],
    cta: "Start Free",
    href: "/register",
    featured: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per month",
    blurb: "For learners who want the full experience.",
    features: ["Everything in Free", "All premium courses", "Certificates", "AI recommendations", "Priority support"],
    cta: "Go Pro",
    href: "/register",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "per organization",
    blurb: "For teams and organizations at scale.",
    features: ["Everything in Pro", "Team management & SSO", "Custom learning paths", "Analytics & reporting", "Dedicated success manager"],
    cta: "Book a Demo",
    href: "/register",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f5] font-sans text-[#0b1a14]">
      <header className="bg-[#04130d] text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-white/85 hover:text-white">
              Log In
            </Link>
            <Link href="/register" className="rounded-xl bg-[#2ee6a6] px-5 py-2.5 text-sm font-semibold text-[#04130d] transition hover:brightness-95">
              Sign Up
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-6 text-center">
          <span className="inline-flex items-center rounded-full border border-[#2ee6a6]/30 bg-[#2ee6a6]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2ee6a6]">
            Pricing
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            Simple pricing that <span className="text-[#2ee6a6]">scales with you</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
            Start free and upgrade as your team grows. No hidden fees, cancel anytime.
          </p>
        </div>
      </header>

      <section className="mx-auto -mt-10 max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-3xl border p-7 shadow-sm ${plan.featured
                  ? "border-[#2ee6a6] bg-[#04130d] text-white shadow-[0_30px_70px_-30px_rgba(10,122,82,0.6)]"
                  : "border-[#e7ece9] bg-white"
                }`}
            >
              {plan.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-[#2ee6a6] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#04130d]">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${plan.featured ? "text-white/70" : "text-[#5b6b63]"}`}>{plan.blurb}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`pb-1 text-xs ${plan.featured ? "text-white/60" : "text-[#5b6b63]"}`}>/ {plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${plan.featured ? "bg-[#2ee6a6]/20 text-[#2ee6a6]" : "bg-[#eafaf2] text-[#0a7a52]"}`}>
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-7 rounded-xl py-3 text-center text-sm font-semibold transition ${plan.featured
                    ? "bg-[#2ee6a6] text-[#04130d] hover:brightness-95"
                    : "border border-[#0b1a14]/15 text-[#0b1a14] hover:bg-[#f1f4f2]"
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[#5b6b63]">
          Need something custom?{" "}
          <Link href="/company" className="font-semibold text-[#0a7a52] hover:underline">
            Talk to our team →
          </Link>
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
