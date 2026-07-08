"use client";

interface ThemeSelectorProps {
  value: string;
  onChange: (theme: string) => void;
}

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <button
      onClick={() => onChange(value === "vs-dark" ? "vs-light" : "vs-dark")}
      className="bg-gray-800 text-gray-300 text-xs border border-gray-600 rounded px-3 py-1.5 hover:bg-gray-700 transition-colors"
      title={`Switch to ${value === "vs-dark" ? "light" : "dark"} theme`}
    >
      {value === "vs-dark" ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
