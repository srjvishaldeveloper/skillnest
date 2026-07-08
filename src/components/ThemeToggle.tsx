"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("skillnest-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    const root = document.querySelector(".dashboard-layout");
    if (root) root.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const root = document.querySelector(".dashboard-layout");
    if (root) root.classList.toggle("dark", next);
    localStorage.setItem("skillnest-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="navbar-icon-btn bg-white dark:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer border border-transparent dark:border-white/[0.15]"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={16} className="text-[#c8ff00]" /> : <Moon size={16} className="text-gray-600" />}
    </button>
  );
}
