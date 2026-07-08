import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ApprovalActions from "@/components/course/ApprovalActions";
import PlatformFeeInput from "@/components/course/PlatformFeeInput";
import QualityScorePanel from "@/components/admin/QualityScorePanel";

const ApprovalsPage = async () => {
  const session = await getSession();
  if (session?.role !== "admin") {
    return (
      <div className="m-6 flex flex-1 items-center justify-center rounded-2xl bg-white p-12 shadow-sm dark:bg-[#1f2419]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            🔒
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Admin Access Required</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You do not have permission to view course approvals.
          </p>
        </div>
      </div>
    );
  }

  const [pending, live] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        instructor: { select: { name: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, duration: true, isPreview: true, summary: true, content: true },
            },
          },
        },
      },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  const totalEnrollments = live.reduce((acc, c) => acc + c._count.enrollments, 0);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md">
              Admin Portal
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Course Approvals & Verification</h1>
            <p className="mt-1 text-sm text-blue-100">
              Review course submissions, inspect curricula, and manage live offerings across the platform.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1f2419] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Pending Review</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{pending.length}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            ⏳
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1f2419] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Live Courses</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{live.length}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            🚀
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1f2419] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Total Enrollments</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalEnrollments}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            👥
          </div>
        </div>
      </div>

      {/* Pending Review Section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1f2419]">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pending Submissions</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {pending.length}
            </span>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-500 dark:bg-emerald-950/30">
              🎉
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">All caught up!</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are currently no course submissions awaiting review.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {pending.map((c) => {
              const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0);
              const totalDuration = c.modules.reduce((sd, m) => sd + m.lessons.reduce((ld, l) => ld + (l.duration || 0), 0), 0);

              return (
                <div key={c.id} className="group relative overflow-hidden rounded-xl border border-amber-200/60 bg-amber-50/20 p-5 transition hover:border-amber-400/80 dark:border-amber-900/40 dark:bg-amber-950/10">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {c.img && (
                          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                            <Image
                              src={c.img}
                              alt={c.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/course/${c.id}`}
                              target="_blank"
                              className="text-lg font-bold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition"
                            >
                              {c.title}
                            </Link>
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {c.level}
                            </span>
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {c.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Instructor: <span className="font-semibold text-gray-700 dark:text-gray-300">{c.instructor.name}</span> · Price: <span className="font-semibold text-emerald-600">₹{c.price || "Free"}</span>
                          </p>
                          <div className="mt-1.5">
                            <PlatformFeeInput courseId={c.id} initialFee={c.platformFeePercent} />
                          </div>
                          {c.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {c.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <span>📦 {c.modules.length} Modules</span>
                            <span>📖 {totalLessons} Lessons</span>
                            {totalDuration > 0 && <span>⏱️ {totalDuration} Mins</span>}
                          </div>
                        </div>
                      </div>

                      {/* Outcomes */}
                      {c.outcomes.length > 0 && (
                        <div className="mt-4 border-t border-amber-200/40 pt-3 dark:border-amber-900/30">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Learning Outcomes:</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.outcomes.map((o, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              >
                                ✓ {o}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quality Score Panel */}
                      {c.qualityScore !== null && c.qualityScore !== undefined && (
                        <QualityScorePanel score={c.qualityScore} notes={c.qualityNotes ?? null} />
                      )}

                      {/* Curriculum breakdown */}
                      {c.modules.length > 0 && (
                        <details className="mt-4 group/det">
                          <summary className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <span>Inspect Curriculum Detail ({c.modules.length} modules, {totalLessons} lessons)</span>
                          </summary>
                          <div className="mt-3 space-y-2 pl-2 border-l-2 border-amber-300 dark:border-amber-800">
                            {c.modules.map((m, mi) => (
                              <div key={m.id} className="rounded-lg border border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-[#171b12]">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                  Module {mi + 1}: {m.title}
                                </p>
                                {m.lessons.length > 0 && (
                                  <ul className="mt-2 space-y-3">
                                    {m.lessons.map((l, li) => (
                                      <li key={l.id} className="border-b border-gray-100/50 dark:border-zinc-800 pb-2 last:border-none last:pb-0">
                                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                          <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                                            <span className="font-mono text-gray-400">{li + 1}.</span>
                                            <span>{l.title}</span>
                                          </span>
                                          <span className="flex items-center gap-2">
                                            {l.duration > 0 && <span className="text-[11px] text-gray-400">{l.duration}m</span>}
                                            {l.isPreview && (
                                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                Free Preview
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                        {l.summary && (
                                          <p className="mt-1 text-[11px] leading-relaxed text-gray-500 bg-gray-50/50 dark:bg-black/20 p-2 rounded-lg border border-gray-100 dark:border-zinc-800">
                                            <span className="font-bold text-skillPurple">AI Summary: </span>{l.summary}
                                          </p>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      <div className="mt-4">
                        <Link
                          href={`/courses/${c.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Open preview in new tab →
                        </Link>
                      </div>
                    </div>

                    <div className="shrink-0 pt-2 lg:pt-0">
                      <ApprovalActions courseId={c.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Published Courses Section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1f2419]">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Live Courses</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {live.length}
            </span>
          </div>
        </div>

        {live.length === 0 ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 dark:bg-gray-800">
              📚
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No published courses online yet.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-gray-100 dark:divide-white/10">
            {live.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3.5 transition hover:bg-gray-50/50 px-2 rounded-lg dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/40 dark:text-emerald-400">
                    ✓
                  </div>
                  <div>
                    <Link href={`/course/${c.id}`} className="font-bold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 text-sm">
                      {c.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span>Instructor: {c.instructor.name}</span>
                      <span>•</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">👥 {c._count.enrollments} enrolled</span>
                    </div>
                  </div>
                </div>
                <ApprovalActions courseId={c.id} live />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsPage;
