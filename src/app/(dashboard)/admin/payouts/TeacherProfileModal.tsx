"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, BookOpen, ShoppingBag, User, Phone, Mail, MapPin, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { getTeacherProfileWithStats } from "@/lib/payoutActions";

export default function TeacherProfileModal({ teacherId }: { teacherId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sub" | "parent">("sub");

  const handleOpen = async () => {
    setIsOpen(true);
    if (!data) {
      setLoading(true);
      setErrorMsg(null);
      const res = await getTeacherProfileWithStats(teacherId);
      if (res.success) {
        setData(res);
      } else {
        setErrorMsg(res.error || "Failed to load profile details.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:opacity-80 transition shrink-0 shadow-sm"
        title="View Profile & Full Course/Sales Details"
      >
        <Image src="/view.png" alt="" width={16} height={16} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#121214] p-6 shadow-2xl border border-gray-100 dark:border-[#27272A] max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-skillBlue dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Teacher Profile & Course Analytics</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Detailed Courses Created & Sales History</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-zinc-400 animate-pulse">Loading profile data...</div>
            ) : !data ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                <p className="text-sm font-medium text-red-500">{errorMsg || "Failed to load profile details."}</p>
                <button
                  type="button"
                  onClick={handleOpen}
                  className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-200 transition"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                {/* Tabs if sub-teacher */}
                {data.teacher.parentTeacher && (
                  <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-900 p-1 mb-4 text-xs font-semibold border border-transparent dark:border-zinc-800">
                    <button
                      onClick={() => setActiveTab("sub")}
                      className={`flex-1 py-2 rounded-md transition ${
                        activeTab === "sub" ? "bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      Sub-Teacher ({data.teacher.name})
                    </button>
                    <button
                      onClick={() => setActiveTab("parent")}
                      className={`flex-1 py-2 rounded-md transition ${
                        activeTab === "parent" ? "bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      Parent Teacher ({data.teacher.parentTeacher.name})
                    </button>
                  </div>
                )}

                {/* Profile View Content */}
                {activeTab === "sub" ? (
                  <ProfileDetails
                    teacher={data.teacher}
                    stats={data.stats}
                    isSub={!!data.teacher.parentTeacher}
                  />
                ) : (
                  <ProfileDetails
                    teacher={data.teacher.parentTeacher}
                    stats={data.parentStats}
                    isParent
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ProfileDetails({
  teacher,
  stats,
  isSub,
  isParent,
}: {
  teacher: any;
  stats: any;
  isSub?: boolean;
  isParent?: boolean;
}) {
  const [showCoursesList, setShowCoursesList] = useState(false);
  const [showSalesList, setShowSalesList] = useState(false);

  return (
    <div className="space-y-4 text-sm">
      {/* Top Banner Card */}
      <div className="rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-zinc-800/80 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{teacher.name}</h4>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {isSub && (
                <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-500/30">
                  Sub-Teacher
                </span>
              )}
              {isParent && (
                <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-purple-200/50 dark:border-purple-500/30">
                  Main / Parent Teacher
                </span>
              )}
              <Link
                href={`/list/teachers/${teacher.id}`}
                target="_blank"
                className="text-xs text-skillBlue dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Full Profile Page <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-zinc-300 border-t border-gray-200/60 dark:border-zinc-800 pt-3">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-400 shrink-0" />
            <span className="truncate">{teacher.email || "No email"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-400 shrink-0" />
            <span>{teacher.phone || "No phone"}</span>
          </div>
          {teacher.address && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-400 shrink-0" />
              <span className="truncate">{teacher.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary Section */}
      <div>
        <h5 className="text-xs font-semibold text-gray-400 dark:text-zinc-400 uppercase tracking-wider mb-2">Overview</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-skillBlue dark:text-blue-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold">Courses Created</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.coursesCount ?? 0}</p>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-semibold">Total Sales</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.salesCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Created Courses Section */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] overflow-hidden">
        <button
          onClick={() => setShowCoursesList(!showCoursesList)}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/60 dark:bg-zinc-900/80 hover:bg-gray-50 dark:hover:bg-zinc-900 transition text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-skillBlue dark:text-blue-400" />
            <span className="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
              Created Courses Details ({stats?.courses?.length ?? 0})
            </span>
          </div>
          {showCoursesList ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-400" />}
        </button>

        {showCoursesList && (
          <div className="p-3 border-t border-gray-100 dark:border-zinc-800 max-h-60 overflow-y-auto">
            {!stats?.courses || stats.courses.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-400 italic text-center py-2">No courses created yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.courses.map((course: any) => (
                  <div key={course.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{course.title}</p>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-400 mt-0.5">
                        Price: ₹{course.price} · Status: <span className="font-medium text-gray-600 dark:text-zinc-300">{course.status}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-blue-50 dark:bg-blue-500/20 text-skillBlue dark:text-blue-400 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-100 dark:border-blue-500/30">
                        {course._count?.enrollments ?? 0} Students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Sold Courses / Sales Orders Section */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] overflow-hidden">
        <button
          onClick={() => setShowSalesList(!showSalesList)}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/60 dark:bg-zinc-900/80 hover:bg-gray-50 dark:hover:bg-zinc-900 transition text-left"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
              Sales / Orders History ({stats?.paidOrders?.length ?? 0})
            </span>
          </div>
          {showSalesList ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-400" />}
        </button>

        {showSalesList && (
          <div className="p-3 border-t border-gray-100 dark:border-zinc-800 max-h-60 overflow-y-auto">
            {!stats?.paidOrders || stats.paidOrders.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-400 italic text-center py-2">No completed sales yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.paidOrders.map((order: any) => (
                  <div key={order.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{order.course?.title || "Course"}</p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        Buyer: <span className="font-medium text-gray-700 dark:text-zinc-200">{order.student?.name}</span> ({order.student?.email || "N/A"})
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-skillGreen dark:text-emerald-400">₹{order.amount}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-400 mt-0.5">
                        {new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bank Details Section */}
      <div>
        <h5 className="text-xs font-semibold text-gray-400 dark:text-zinc-400 uppercase tracking-wider mb-2">Bank Account Details</h5>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3.5 space-y-1.5 text-xs text-gray-700 dark:text-zinc-300 bg-white dark:bg-[#18181B]">
          {teacher.bankName || teacher.upiId ? (
            <>
              {teacher.accountHolderName && (
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">Account Holder:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right truncate min-w-0" title={teacher.accountHolderName}>{teacher.accountHolderName}</span>
                </div>
              )}
              {teacher.bankName && (
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">Bank Name:</span>
                  <span className="font-medium text-right truncate min-w-0 text-gray-800 dark:text-zinc-200" title={teacher.bankName}>{teacher.bankName}</span>
                </div>
              )}
              {teacher.accountNumber && (
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">Account Number:</span>
                  <span className="font-mono font-medium text-right truncate min-w-0 text-gray-800 dark:text-zinc-200" title={teacher.accountNumber}>{teacher.accountNumber}</span>
                </div>
              )}
              {teacher.ifsc && (
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">IFSC Code:</span>
                  <span className="font-mono font-medium text-right truncate min-w-0 text-gray-800 dark:text-zinc-200" title={teacher.ifsc}>{teacher.ifsc}</span>
                </div>
              )}
              {teacher.upiId && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-800 pt-1.5 mt-1.5 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">UPI ID:</span>
                  <span className="font-semibold text-skillGreen dark:text-emerald-400 text-right truncate min-w-0" title={teacher.upiId}>{teacher.upiId}</span>
                </div>
              )}
              {teacher.panNumber && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-800 pt-1.5 mt-1.5 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">PAN Card No:</span>
                  <span className="font-mono font-semibold text-skillBlue dark:text-blue-400 text-right truncate min-w-0" title={teacher.panNumber}>{teacher.panNumber}</span>
                </div>
              )}
              {teacher.aadharNumber && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-800 pt-1.5 mt-1.5 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">Aadhaar Card No:</span>
                  <span className="font-mono font-semibold text-purple-600 dark:text-purple-400 text-right truncate min-w-0" title={teacher.aadharNumber}>{teacher.aadharNumber}</span>
                </div>
              )}
              {teacher.certificateUrl && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-800 pt-1.5 mt-1.5 min-w-0">
                  <span className="text-gray-400 dark:text-zinc-400 shrink-0">Certificate:</span>
                  <a
                    href={teacher.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-skillBlue dark:text-blue-400 hover:underline font-semibold text-right truncate min-w-0"
                    title="View Certificate"
                  >
                    View Document ↗
                  </a>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 dark:text-zinc-400 italic text-center py-1">No bank details recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
