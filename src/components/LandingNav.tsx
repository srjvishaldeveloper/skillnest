"use client";

import { useEffect, useMemo, useState } from "react";

type LandingNavProps = {
  links: string[];
};

const sectionMap: Record<string, string> = {
  Home: "home",
  About: "about",
  Courses: "courses",
  Testimonials: "testimonials",
  "Free Webinars": "webinars",
};

const LandingNav = ({ links }: LandingNavProps) => {
  const resolvedLinks = useMemo(
    () =>
      links.map((label) => ({
        label,
        target: sectionMap[label] || label.toLowerCase().replace(/\s+/g, "-"),
      })),
    [links]
  );

  const [activeId, setActiveId] = useState(resolvedLinks[0]?.target || "home");

  useEffect(() => {
    const updateActive = () => {
      const sections = resolvedLinks
        .map(({ target }) => document.getElementById(target))
        .filter(Boolean) as HTMLElement[];

      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 140 && rect.bottom >= 140;
      });

      if (current?.id) {
        setActiveId(current.id);
      }
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("hashchange", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", updateActive);
    };
  }, [resolvedLinks]);

  return (
    <ul className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm md:flex">
      {resolvedLinks.map(({ label, target }) => {
        const isActive = activeId === target;
        return (
          <li key={label}>
            <a
              href={`#${target}`}
              onClick={() => setActiveId(target)}
              className={`rounded-full px-4 py-1.5 transition ${
                isActive
                  ? "bg-[#224e7a] font-medium text-white"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default LandingNav;
