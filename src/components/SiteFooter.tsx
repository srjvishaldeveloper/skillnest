import Link from "next/link";
import Image from "next/image";
import { HUBNEST_URL, JOBNEST_URL, GIGNEST_URL } from "@/lib/siblings";

const Logo = () => (
  <Image src="/skillnest.png" alt="SkillNest Logo" width={200} height={50} className="h-14 w-auto object-contain" priority />
);

const Social = ({ label, href, src, imgClassName }: { label: string; href: string; src: string; imgClassName?: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-xl p-1 transition-all duration-200 hover:scale-125 hover:bg-white/10"
  >
    <Image src={src} alt={label} width={32} height={32} className={`h-full w-full object-contain ${imgClassName || ""}`} />
  </a>
);

// Same structure across the ecosystem; only "Product" changes per platform.
const product = [
  { label: "Explore Courses", href: "/explore-courses" },
  { label: "Pricing", href: "/pricing" },
  { label: "Become an Instructor", href: "/register" },
  { label: "Certificates", href: "/explore-courses" },
  { label: "For Teams", href: "/company" },
];

const ecosystem = [
  { label: "HubNest", href: HUBNEST_URL, external: true },
  { label: "JobNest", href: `${JOBNEST_URL}/jobs/`, external: true },
  { label: "SkillNest", href: "/", external: false },
  { label: "GigNest", href: GIGNEST_URL, external: true },
];

const company = [
  { label: "About HubNest", href: HUBNEST_URL, external: true },
  { label: "Careers", href: `${HUBNEST_URL}/careers`, external: true },
  { label: "Newsroom", href: `${HUBNEST_URL}/news`, external: true },
  { label: "Contact", href: "/company", external: false },
];

const resources = [
  { label: "Help Center", href: "/company", external: false },
  { label: "Blog", href: "/company", external: false },
  { label: "Community", href: "/explore-courses", external: false },
  { label: "Status", href: "#", external: false },
];

const legal = [
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Security", href: "#" },
];

function Col({ title, items }: { title: string; items: { label: string; href: string; external?: boolean }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2ee6a6]">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-[#a3b8b0]">
        {items.map((it) => (
          <li key={it.label}>
            {it.external ? (
              <a href={it.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                {it.label}
              </a>
            ) : (
              <Link href={it.href} className="hover:text-white transition-colors">
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter({ brand = "SkillNest" }: { brand?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-[#04130d] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-6">
        {/* Brand block */}
        <div className="sm:col-span-2">
          <div className="flex items-center">
            <Logo />
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#a3b8b0]">
            AI-driven learning platform for modern workplaces. One login across the HubNest
            ecosystem.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2ee6a6]/15 px-3 py-1.5 text-[11px] font-semibold text-[#2ee6a6] ring-1 ring-[#2ee6a6]/30">
            <Image src="/leaf.png" alt="" width={16} height={16} className="h-4 w-4 object-contain shrink-0" /> A HubNest company
          </span>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Social
              label="Facebook"
              href="https://www.facebook.com/people/Job-Nest/61571723270922/"
              src="/facebook.png"
            />
            <Social
              label="LinkedIn"
              href="https://www.linkedin.com/company/srj-job-search/"
              src="/linkedin.png"
              imgClassName="scale-130"
            />
            <Social
              label="Instagram"
              href="https://www.instagram.com/job__nest"
              src="/instagram.png"
            />
            <Social
              label="YouTube"
              href="https://www.youtube.com/@jobnest-i9e"
              src="/youtube.png"
            />
            <Social
              label="Pinterest"
              href="https://in.pinterest.com/job_nest/"
              src="/pinterest.png"
            />
            <Social
              label="Quora"
              href="https://www.quora.com/profile/Srj-Jobsearch"
              src="/quora.png"
            />
          </div>
        </div>

        <Col title="Product" items={product} />
        <Col title="Ecosystem" items={ecosystem} />
        <Col title="Company" items={company} />
        <Col title="Resources" items={resources} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-sm text-[#a3b8b0] sm:flex-row">
          <p>© {year} HubNest Technologies. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legal.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-[#2ee6a6] transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
