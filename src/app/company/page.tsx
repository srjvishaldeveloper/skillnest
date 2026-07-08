import type { Metadata } from "next";
import Link from "next/link";
import { JOBNEST_URL, GIGNEST_URL } from "@/lib/siblings";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Company — SkillNest",
  description: "About SkillNest and the connected JobNest career ecosystem.",
};

import Image from "next/image";

const Logo = () => (
  <Image src="/skillnest.png" alt="SkillNest Logo" width={200} height={50} className="h-12 md:h-14 w-auto object-contain" priority />
);

const ecosystem = [
  {
    name: "SkillNest",
    tag: "Learn",
    desc: "AI-driven learning platform for upskilling and workplace training.",
    href: "/",
    external: false,
  },
  {
    name: "JobNest",
    tag: "Work",
    desc: "Find jobs, build your profile, and get matched with employers.",
    href: `${JOBNEST_URL}/jobs/`,
    external: true,
  },
  {
    name: "GigNest",
    tag: "Freelance",
    desc: "Discover freelance projects and earn with your skills.",
    href: GIGNEST_URL,
    external: true,
  },
];

const values = [
  { title: "Learner-first", desc: "Every decision starts with the people learning and growing on our platform." },
  { title: "AI with purpose", desc: "We use automation to remove busywork — not to replace human mentorship." },
  { title: "One identity", desc: "Your SkillNest, JobNest and GigNest accounts are connected through a single sign-on." },
];

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f5] font-sans text-[#0b1a14]">
      <header className="bg-[#04130d] text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-white/85 hover:text-white">
              Pricing
            </Link>
            <Link href="/register" className="rounded-xl bg-[#2ee6a6] px-5 py-2.5 text-sm font-semibold text-[#04130d] transition hover:brightness-95">
              Get Started
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-6 text-center">
          <span className="inline-flex items-center rounded-full border border-[#2ee6a6]/30 bg-[#2ee6a6]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2ee6a6]">
            Company
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            Building the <span className="text-[#2ee6a6]">career ecosystem</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
            SkillNest helps people and organizations learn faster. Together with JobNest and
            GigNest, we connect learning, work and freelancing under one account.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-extrabold tracking-tight">Our ecosystem</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ecosystem.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              target={p.external ? "_blank" : undefined}
              rel={p.external ? "noopener noreferrer" : undefined}
              className="group rounded-3xl border border-[#e7ece9] bg-white p-7 transition hover:-translate-y-1 hover:border-[#2ee6a6]/40 hover:shadow-md"
            >
              <span className="inline-flex rounded-full bg-[#eafaf2] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0a7a52]">
                {p.tag}
              </span>
              <h3 className="mt-4 text-xl font-bold">{p.name}</h3>
              <p className="mt-2 text-sm leading-7 text-[#5b6b63]">{p.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#0a7a52] group-hover:underline">
                {p.external ? "Visit " + p.name : "Explore"} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-extrabold tracking-tight">What we believe</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-[#e7ece9] bg-[#f9fbfa] p-6">
                <h3 className="text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#5b6b63]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#06281d,#0a7a52)] px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-extrabold">Want to learn more?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/75">
            Get a personalized walkthrough of SkillNest for your organization.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-block rounded-full bg-[#2ee6a6] px-7 py-3 text-sm font-semibold text-[#04130d] transition hover:brightness-95"
          >
            Book a Demo
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
