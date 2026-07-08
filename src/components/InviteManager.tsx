"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInviteLink, revokeInviteLink } from "@/lib/inviteActions";
import type { TeacherInviteLink } from "@prisma/client";
import Link from "next/link";

interface InviteLinkWithCount extends TeacherInviteLink {
  _count: { invitedTeachers: number };
}

export default function InviteManager({
  links,
  subTeachers,
  isSubTeacher = false,
  isAdmin = false,
}: {
  links: InviteLinkWithCount[];
  subTeachers: { id: string; name: string; email: string | null; username: string }[];
  isSubTeacher?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState(50);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const now = new Date();
  const minDate = now.toISOString().slice(0, 16);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNewCode(null);

    const fd = new FormData();
    fd.set("expiresAt", expiresAt);
    fd.set("maxUses", String(maxUses));

    const res = await createInviteLink(fd);
    if (res.success && res.code) {
      setNewCode(res.code);
      setExpiresAt("");
      setMaxUses(50);
      router.refresh();
    } else {
      setError(res.error || "Failed to create link");
    }
  };

  const handleRevoke = async (linkId: number) => {
    const fd = new FormData();
    fd.set("linkId", String(linkId));
    await revokeInviteLink(fd);
    router.refresh();
  };

  const baseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="rounded-2xl bg-white p-5">
      <h2 className="text-lg font-semibold text-skillDark">Invite Teachers</h2>
      <p className="mt-1 text-sm text-gray-500">
        Invite other teachers under you. They get the same responsibilities, but their courses need your review.
      </p>

      {isSubTeacher && !isAdmin ? (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          You are a sub-teacher and cannot invite other teachers.
        </div>
      ) : (
        <form onSubmit={handleCreate} className="mt-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Expires at</label>
            <input
              type="datetime-local"
              value={expiresAt}
              min={minDate}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-skillBlue focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max uses</label>
            <input
              type="number"
              value={maxUses}
              min={1}
              max={1000}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-skillBlue focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-skillBlue px-5 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            Generate Link
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {newCode && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Link created!</p>
          <p className="text-xs text-green-600">Teachers who register through this link will be added under you.</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={`${baseUrl}/register?ref=${newCode}`}
              className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${baseUrl}/register?ref=${newCode}`);
              }}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-600">
          Your invite links ({links.length})
        </h3>
        {links.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No links created yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {links.map((link) => {
              const isExpired = new Date(link.expiresAt) < new Date();
              const isFull = link.useCount >= link.maxUses;
              const isActive = !link.isRevoked && !isExpired && !isFull;

              return (
                <div
                  key={link.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    isActive
                      ? "border-gray-200 bg-white"
                      : "border-red-100 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-gray-500">
                        {`${baseUrl}/register?ref=${link.code}`}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {(link as any).teacher?.name && (
                          <span className="text-gray-500">
                            By: {(link as any).teacher.name}
                          </span>
                        )}
                        <span>
                          Uses: <strong>{link.useCount}</strong> / {link.maxUses}
                        </span>
                        <span>
                          Expires:{" "}
                          {new Date(link.expiresAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {link._count.invitedTeachers > 0 && (
                          <span className="text-skillBlue">
                            {link._count.invitedTeachers} joined
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {link.isRevoked ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          Revoked
                        </span>
                      ) : isExpired ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          Expired
                        </span>
                      ) : isFull ? (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-600">
                          Full
                        </span>
                      ) : (
                        <>
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-600">
                            Active
                          </span>
                          {(!isSubTeacher || isAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(link.id)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Revoke
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subTeachers.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-600">
            Sub-teachers ({subTeachers.length})
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {subTeachers.map((t) => (
              <Link
                key={t.id}
                href={`/list/teachers/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.email || t.username}</p>
                </div>
                <span className="text-xs text-skillBlue">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
