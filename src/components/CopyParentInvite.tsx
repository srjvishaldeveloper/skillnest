"use client";

import { useState } from "react";

export default function CopyParentInvite({ studentUsername }: { studentUsername: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const inviteUrl = `${window.location.origin}/register?profession=parent&student=${studentUsername}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1f2419] p-5 text-white shadow-lg">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">👪</span>
        <h3 className="text-sm font-semibold text-[#c5f82a]">Invite Parent / Guardian</h3>
      </div>
      <p className="text-xs text-gray-400 leading-normal">
        Share this unique link with your parent to link their profile to your student account.
      </p>
      <button
        onClick={copyLink}
        className="mt-1 w-full rounded-md bg-[#c5f82a] py-2 text-xs font-semibold text-black transition hover:brightness-110 active:scale-[0.98]"
      >
        {copied ? "✓ Copied Link!" : "📋 Copy Invite Link"}
      </button>
    </div>
  );
}
