"use client";

export default function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
    >
      ⬇ {label}
    </button>
  );
}
