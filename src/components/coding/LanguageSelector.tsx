"use client";

const LANGUAGES = [
  { key: "javascript", label: "JavaScript" },
  { key: "typescript", label: "TypeScript" },
  { key: "python", label: "Python" },
  { key: "java", label: "Java" },
  { key: "c", label: "C" },
  { key: "cpp", label: "C++" },
  { key: "go", label: "Go" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-gray-800 text-gray-200 text-sm border border-gray-600 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-skillBlue"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.key} value={lang.key}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
