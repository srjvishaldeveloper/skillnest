import Link from "next/link";

/**
 * HeroDashboard — the floating product mock shown in the landing hero:
 * a "Learning Overview" card with a completion ring + legend, an
 * "AI Recommendation" card, and an "Automation Saved" pill. Presentational
 * only (no state), safe to render in a server component.
 */

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z" />
    </svg>
  );
}

function TrendUp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className}>
      <path d="M4 17l6-6 4 4 6-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Clock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const legend = [
  { label: "Completed", value: "1,240", color: "#2ee6a6", ring: "bg-[#2ee6a6]/20 text-[#2ee6a6]" },
  { label: "In Progress", value: "210", color: "#38bdf8", ring: "bg-[#38bdf8]/20 text-[#38bdf8]" },
  { label: "Not Started", value: "110", color: "#34d399", ring: "bg-[#34d399]/20 text-[#34d399]" },
];

export default function HeroDashboard() {
  const pct = 85;
  const offset = RING_C * (1 - pct / 100);

  return (
    <div className="relative z-10 w-full max-w-md">
      {/* Learning Overview */}
      <div className="rounded-3xl border border-white/10 bg-[#06281d]/80 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Learning Overview</p>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/70">
            This Month <Chevron className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="mt-6 flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                stroke="#2ee6a6"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white">{pct}%</span>
              <span className="text-[10px] text-white/60">Completion Rate</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-white/80">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${item.ring}`}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                  </span>
                  {item.label}
                </span>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2ee6a6]">
          <TrendUp className="h-3.5 w-3.5" /> 24% vs last month
        </p>
      </div>

      {/* AI Recommendation */}
      <div className="mt-4 rounded-3xl border border-white/10 bg-[#06281d]/80 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-md">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Spark className="h-4 w-4 text-[#2ee6a6]" /> AI Recommendation
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-16 shrink-0 rounded-lg bg-[linear-gradient(135deg,#0a7a52,#04130d)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Leadership Essentials</p>
            <p className="text-xs text-white/60">12 Modules</p>
          </div>
        </div>
        <Link
          href="/explore-courses"
          className="mt-4 block w-full rounded-xl bg-[#2ee6a6] py-2.5 text-center text-sm font-semibold text-[#04130d] transition hover:brightness-95"
        >
          Continue Learning
        </Link>
      </div>

      {/* Automation pill */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#06281d]/80 px-4 py-2 text-sm text-white/80 shadow-lg backdrop-blur-md">
        <Clock className="h-4 w-4 text-[#facc15]" />
        Automation Saved <span className="font-semibold text-white">320+ Hours</span>
      </div>
    </div>
  );
}
