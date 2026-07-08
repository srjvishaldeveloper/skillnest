import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCmsPage } from "@/lib/cms";
import prisma from "@/lib/prisma";
import PopularCourses from "@/components/PopularCourses";
import HeroDashboard from "@/components/HeroDashboard";
import LandingHeader from "@/components/LandingHeader";
import InActionTabs from "@/components/InActionTabs";
import SiteFooter from "@/components/SiteFooter";
import { Prisma } from "@prisma/client";

export async function generateMetadata(): Promise<Metadata> {
  const landing = await getCmsPage("landing");
  return {
    title: landing.seo.title,
    description: landing.seo.description,
  };
}

const ACCENT = "#2ee6a6";

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M7 17 17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Brain = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 6 17a3 3 0 0 0 3 3 1.5 1.5 0 0 0 1.5-1.5V5A2 2 0 0 0 9 3Z" strokeLinejoin="round" />
    <path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A3 3 0 0 1 18 17a3 3 0 0 1-3 3 1.5 1.5 0 0 1-1.5-1.5V5A2 2 0 0 1 15 3Z" strokeLinejoin="round" />
  </svg>
);

const Bolt = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z" />
  </svg>
);

const ChartUp = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
    <path d="M4 17l5-5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Shield = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Rocket = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" strokeLinejoin="round" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" strokeLinejoin="round" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" strokeLinejoin="round" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" strokeLinejoin="round" />
  </svg>
);

const Logo = ({ className = "" }: { className?: string }) => (
  <Image src="/skillnest.png" alt="SkillNest Logo" width={32} height={32} className={`object-contain ${className}`} />
);

export default async function LandingPage() {
  const landing = await getCmsPage("landing");
  const brand = landing.brand?.name || "SkillNest";

  const features = [
    { icon: Brain, label: "AI Career Matching" },
    { icon: Bolt, label: "Instant Job Alerts" },
    { icon: ChartUp, label: "Skill Analytics" },
    { icon: Rocket, label: "Career Accelerator" },
  ];
  let liveCourses: any[] = [];
  try {
    liveCourses = await prisma.course.findMany({
      where: { published: true, status: "PUBLISHED" },
      include: {
        instructor: { select: { name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch (err) {
    console.error("Error querying database courses:", err);
  }
  

  const trustedLogos = (landing as any).trustedLogos || (landing as any).trustedBy || ["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro"];
  
  const stats = [
    { value: "50K+", title: "Active Learners", note: "Students upskilling every month on the platform", accent: false, big: false },
    { value: "92%", title: "Job Placement Rate", note: "Learners hired within 6 months of course completion", accent: true, big: true },
    { value: "500+", title: "Industry Courses", note: "Curated by top instructors and hiring managers", accent: false, big: false },
    { value: "4.9/5", title: "Learner Satisfaction", note: "Average rating across all courses and programs", accent: false, big: true },
  ];

  const solutions = [
    { title: "Career-Ready Skills", desc: "Master in-demand technologies with hands-on projects, real-world assignments, and mentor-guided learning paths." },
    { title: "Job Placement Support", desc: "Get matched with top employers, receive interview coaching, and access exclusive job openings through JobNest." },
    { title: "Professional Certificates", desc: "Earn industry-recognized certificates that boost your profile and validate your skills to recruiters." },
  ];

  return (
    

    <div className="min-h-screen bg-[#f4f6f5] font-sans text-[#0b1a14]">
      {/* ---- Hero (dark green) ---- */}
      <section className="relative overflow-hidden bg-[#04130d] text-white">
        {/* layered green glow behind the dashboard */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(58%_46%_at_72%_16%,rgba(46,230,166,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(40%_60%_at_98%_50%,rgba(10,122,82,0.28),transparent_55%)]" />
        {/* faint dotted texture, top-right */}
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-1/2 opacity-[0.18] [background-image:radial-gradient(rgba(46,230,166,0.6)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(circle_at_85%_20%,black,transparent_60%)]" />
        {/* flowing wave line on the right */}
        <svg
          className="pointer-events-none absolute right-0 top-24 hidden h-72 w-[42%] opacity-40 lg:block"
          viewBox="0 0 600 300"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M0 220 C 150 120, 300 280, 450 140 S 650 40, 800 120" stroke="rgba(46,230,166,0.5)" strokeWidth="1.5" />
          <path d="M0 260 C 160 170, 320 320, 470 190 S 660 90, 820 170" stroke="rgba(46,230,166,0.25)" strokeWidth="1.5" />
        </svg>

        {/* Nav */}
        <LandingHeader brand={brand} />

        {/* Hero grid */}
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-12 pt-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2ee6a6]/30 bg-[#2ee6a6]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2ee6a6]">
              <span aria-hidden>✦</span> #1 AI-Driven Learning Platform, LMS
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.04] tracking-tight md:text-6xl">
              A complete learning platform for{" "}
              <span className="text-[#2ee6a6]">modern workplaces</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
              From onboarding and compliance training to employee development — {brand} uses AI and
              automation to cut time and costs by up to 90%, while boosting completion rates and
              engagement across your organization.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2ee6a6] px-6 py-3.5 text-sm font-semibold text-[#04130d] shadow-[0_12px_30px_-10px_rgba(46,230,166,0.7)] transition hover:brightness-95"
              >
                Book a Demo <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Try for Free <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {features.map((f) => (
                <div key={f.label}>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2ee6a6]/12 text-[#2ee6a6] ring-1 ring-inset ring-[#2ee6a6]/20">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold leading-snug text-white/90">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: dashboard mock + mascot */}
          <div className="relative min-h-[480px]">
            <div className="relative z-10 mr-auto max-w-md">
              <HeroDashboard />
            </div>
            <Image
              src="/hero01.png"
              alt={`${brand} mascot`}
              width={520}
              height={650}
              priority
              style={{ width: "auto" }}
              className="pointer-events-none absolute -bottom-24 -right-16 z-20 hidden h-[480px] drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)] lg:block xl:-right-24 xl:h-[540px]"
            />
          </div>
        </div>

        {/* Trusted-by logo strip */}
        <div className="relative border-t border-white/10 bg-white/[0.02]">
          <div className={`mx-auto flex max-w-7xl flex-wrap items-center px-6 py-6 gap-x-10 gap-y-4 ${trustedLogos.length <= 6 ? "justify-center lg:justify-between" : "justify-center"}`}>
            <span className="max-w-[150px] text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] text-[#2ee6a6]/80">
              Trusted by innovative teams worldwide
            </span>
            {trustedLogos.map((name: string) => (
              <span key={name} className="text-lg font-semibold tracking-tight text-white/40">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- In action ---- */}
      <section id="platform" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#0b1a14]">
          {(landing as any).inAction?.title || `See ${brand} in action`}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5b6b63]">
          Experience how AI transforms workplace learning — from interactive courses to live
          sessions that inspire growth and engagement across every team.
        </p>

        <InActionTabs brand={brand} data={(landing as any).inAction} />
      </section>

      {/* ---- Impact stats ---- */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <span className="inline-flex items-center rounded-full border border-[#cdeede] bg-[#eafaf2] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0a7a52]">
          The learning platform with impact
        </span>
        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-[#0b1a14] md:text-4xl">
          {brand} drives <span className="text-[#9aa8a1]">standout results for clients</span>, lifting
          training impact and engagement
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.title}
              className={`flex flex-col rounded-2xl border p-6 text-left shadow-sm ${
                s.accent
                  ? "border-[#bff0db] bg-[linear-gradient(180deg,#eafaf2,#ffffff)]"
                  : "border-[#e7ece9] bg-white"
              }`}
            >
              <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${s.accent ? "bg-[#2ee6a6]/15 text-[#0a7a52]" : "bg-[#f1f4f2] text-[#5b6b63]"}`}>
                <Check className="h-4 w-4" />
              </div>
              <p className={`text-4xl font-extrabold ${s.accent ? "text-[#0a7a52]" : "text-[#0b1a14]"}`}>
                {s.value}
              </p>
              <p className="mt-3 text-sm font-bold text-[#0b1a14]">{s.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#5b6b63]">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Solutions (dark) ---- */}
      <section id="solutions" className="scroll-mt-24 bg-[linear-gradient(180deg,#04130d,#06281d)] py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Solutions for all learning purposes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
            {brand} has solutions for all your training needs, whether it&apos;s compliance training,
            onboarding or competency development.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {solutions.map((sol) => (
              <div key={sol.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ee6a6]/15 text-[#2ee6a6]">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{sol.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">{sol.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Popular courses (real data) ---- */}
      <section id="resources" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0b1a14]">Popular courses</h2>
            <p className="mt-2 text-sm text-[#5b6b63]">Published courses from the {brand} catalog.</p>
          </div>
          <Link href="/explore-courses" className="text-sm font-semibold text-[#0a7a52] hover:underline">
            View all →
          </Link>
        </div>
        <PopularCourses courses={liveCourses.length > 0 ? liveCourses : landing.courses.items} />
      </section>

      {/* ---- CTA ---- */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#06281d,#0a7a52)] px-6 py-14 text-center text-white">
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#2ee6a6]/20 blur-[100px]" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold leading-tight md:text-4xl">
            Ready to set a new standard for workplace training?
          </h2>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="rounded-full bg-[#2ee6a6] px-7 py-3 text-sm font-semibold text-[#04130d] transition hover:brightness-95">
              Book a Demo
            </Link>
            <Link href="/register" className="rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Try for Free
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter brand={brand} />
    </div>
  );
}
