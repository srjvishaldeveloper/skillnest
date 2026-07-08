import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTeacherBalance } from "@/lib/payoutActions";
import WithdrawButton from "./WithdrawButton";
import WithdrawCourseButton from "./WithdrawCourseButton";
import BankDetailsForm from "./BankDetailsForm";
import SubTeacherActions from "./SubTeacherActions";
import SubTeacherPayoutModal from "../../teacher/payouts/SubTeacherPayoutModal";
import TeacherProfileModal from "../../admin/payouts/TeacherProfileModal";

const Stat = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="flex-1 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-4 shadow-sm">
    <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    <div className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</div>
  </div>
);

const InstructorAnalyticsPage = async () => {
  const session = await getSession();
  if (session?.role !== "teacher" && session?.role !== "admin") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="mt-4 text-sm text-gray-400">Instructors only.</p>
      </div>
    );
  }

  const courseWhere =
    session.role === "admin" ? {} : { instructorId: session.userId };

  const courses = await prisma.course.findMany({
    where: courseWhere,
    include: {
      reviews: { select: { rating: true } },
      modules: { select: { _count: { select: { lessons: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const courseIds = courses.map((c) => c.id);

  const revenueRows = courseIds.length
    ? await prisma.order.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds }, status: "PAID" },
        _sum: { amount: true },
      })
    : [];
  const revenueByCourse = new Map(
    revenueRows.map((r) => [r.courseId, r._sum.amount || 0])
  );

  const orderCountRows = courseIds.length
    ? await prisma.order.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds }, status: "PAID" },
        _count: true,
      })
    : [];
  const salesByCourse = new Map(
    orderCountRows.map((r) => [r.courseId, r._count])
  );

  const progress = courseIds.length
    ? await prisma.lessonProgress.findMany({
        where: { lesson: { module: { courseId: { in: courseIds } } } },
        select: { lesson: { select: { module: { select: { courseId: true } } } } },
      })
    : [];
  const doneByCourse = new Map<number, number>();
  progress.forEach((p) => {
    const cId = p.lesson.module.courseId;
    doneByCourse.set(cId, (doneByCourse.get(cId) || 0) + 1);
  });

  let balance = { gross: 0, feePercent: 0, totalFee: 0, net: 0, withdrawn: 0, available: 0 };
  let pendingRequest = null;
  let teacherBank = { accountHolderName: null as string | null, bankName: null as string | null, accountNumber: null as string | null, ifsc: null as string | null, upiId: null as string | null };
  let subTeacherRequests: any[] = [];
  let hasSubTeachers = false;
  // per-course pending withdrawals map
  let pendingCourseIds = new Set<number>();
  // per-course available balances map
  let courseAvailableMap = new Map<number, number>();
  if (session.role === "teacher" && session.userId) {
    balance = await getTeacherBalance(session.userId);
    pendingRequest = await prisma.withdrawalRequest.findFirst({
      where: { teacherId: session.userId, status: "PENDING", courseId: null },
      select: { id: true, parentApproved: true },
    });

    // get all pending per-course withdrawal requests
    const pendingCourseRequests = await prisma.withdrawalRequest.findMany({
      where: { teacherId: session.userId, status: "PENDING", courseId: { not: null } },
      select: { courseId: true },
    });
    pendingCourseIds = new Set(pendingCourseRequests.map(r => r.courseId!).filter(Boolean));

    // per-course analytics
    for (const c of courses) {
      const cb = await getTeacherBalance(session.userId, c.id);
      courseAvailableMap.set(c.id, cb.available);
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.userId },
      select: {
        accountHolderName: true, bankName: true, accountNumber: true, ifsc: true, upiId: true,
        _count: { select: { subTeachers: true } },
      },
    });
    if (teacher) {
      teacherBank = teacher;
      hasSubTeachers = teacher._count.subTeachers > 0;
    }
    if (hasSubTeachers) {
      subTeacherRequests = await prisma.withdrawalRequest.findMany({
        where: {
          teacher: { parentTeacherId: session.userId },
        },
        orderBy: { createdAt: "desc" },
        include: {
          teacher: {
            select: {
              name: true,
              email: true,
              accountHolderName: true,
              bankName: true,
              accountNumber: true,
              ifsc: true,
              upiId: true,
            },
          },
        },
      });
    }
  }

  const rows = courses.map((c) => {
    const lessons = c.modules.reduce((s, m) => s + m._count.lessons, 0);
    const enrollments = c._count.enrollments;
    const done = doneByCourse.get(c.id) || 0;
    const completion =
      lessons > 0 && enrollments > 0
        ? Math.round((done / (lessons * enrollments)) * 100)
        : 0;
    const rating = c.reviews.length
      ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
      : 0;
    const revenue = revenueByCourse.get(c.id) || 0;
    const sales = salesByCourse.get(c.id) || 0;
    const courseFeePct = (c as { platformFeePercent: number }).platformFeePercent ?? 0;
    const teacherShare = Math.round(revenue * (100 - courseFeePct) / 100);
    return {
      id: c.id,
      title: c.title,
      status: c.status,
      enrollments,
      revenue,
      sales,
      teacherShare,
      courseFeePct,
      completion,
      rating,
      reviews: c.reviews.length,
    };
  });

  const totalEnroll = rows.reduce((s, r) => s + r.enrollments, 0);
  const avgRating =
    rows.filter((r) => r.reviews > 0).length > 0
      ? (
          rows.reduce((s, r) => s + r.rating * r.reviews, 0) /
          rows.reduce((s, r) => s + r.reviews, 0)
        ).toFixed(1)
      : "—";
  const avgCompletion = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.completion, 0) / rows.length)
    : 0;

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <h1 className="text-lg font-semibold">
        {session.role === "admin" ? "All Courses Analytics" : "My Analytics"}
      </h1>

      <div className="flex flex-wrap gap-4">
        <Stat label="Total Enrollments" value={String(totalEnroll)} accent="text-skillBlue" />
        <Stat label="Avg Completion" value={`${avgCompletion}%`} accent="text-skillPurple" />
        <Stat label="Avg Rating" value={String(avgRating)} accent="text-skillYellow" />
      </div>

      {session.role === "teacher" && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-6 shadow-sm">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Earnings Overview</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 p-5 min-w-[220px]">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Available to Withdraw</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-[#C5F82A] mt-1">₹{balance.available}</p>
            </div>
            <WithdrawButton available={balance.available} hasPending={!!pendingRequest} />
          </div>
          <div className="mt-4">
            <BankDetailsForm
              accountHolderName={teacherBank.accountHolderName}
              bankName={teacherBank.bankName}
              accountNumber={teacherBank.accountNumber}
              ifsc={teacherBank.ifsc}
              upiId={teacherBank.upiId}
            />
          </div>
          {pendingRequest && (
            <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-skillYellow">Your withdrawal request is currently pending admin processing.</p>
          )}
        </div>
      )}

      {session.role === "teacher" && hasSubTeachers && subTeacherRequests.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-6 shadow-sm text-gray-900 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">Sub-teacher Withdrawal Requests</h2>
            <Link href="/teacher/payouts" className="text-xs text-skillBlue dark:text-blue-400 font-semibold hover:underline">
              Manage All Payouts →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {subTeacherRequests.map((req: any) => (
              <div key={req.id} className="rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50 dark:bg-[#18181B] p-4 text-gray-900 dark:text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">{req.teacher.name}</p>
                      <TeacherProfileModal teacherId={req.teacherId} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{req.teacher.email}</p>
                    <div className="mt-2 flex gap-4 text-sm flex-wrap">
                      <span>Gross: <strong>₹{req.amount}</strong></span>
                      <span>Net: <strong className="text-skillGreen dark:text-emerald-400">₹{req.netAmount}</strong></span>
                    </div>
                    <div className="mt-1.5 flex gap-2 text-xs flex-wrap">
                      <span className={`font-semibold ${req.parentApproved ? "text-skillGreen dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}>
                        {req.parentApproved ? "✓ Your Approval Granted" : "⚠️ Awaiting Your Approval"}
                      </span>
                      {req.status === "PROCESSED" && !req.paidToSubAt && (
                        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-[11px]">
                          Admin Processed — Transfer Funds to Sub
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-zinc-400 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <SubTeacherPayoutModal
                    requestId={req.id}
                    subTeacherName={req.teacher.name}
                    subTeacherEmail={req.teacher.email}
                    bankDetails={req.teacher}
                    amount={req.amount}
                    netAmount={req.netAmount}
                    parentApproved={req.parentApproved}
                    paidToSubAt={req.paidToSubAt}
                    adminStatus={req.status}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md bg-white p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
              <th className="py-2">Course</th>
              <th className="py-2">Status</th>
              <th className="py-2">Sales</th>
              <th className="py-2">Learners</th>
              <th className="py-2">Earnings</th>
              <th className="py-2">Completion</th>
              <th className="py-2">Rating</th>
              {session.role === "teacher" && <th className="py-2">Withdraw</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={session.role === "teacher" ? 8 : 7} className="py-4 text-gray-400">No courses yet.</td>
              </tr>
            )}
            {rows.map((r) => {
              const courseAvail = courseAvailableMap.get(r.id) ?? 0;
              const hasCoursePending = pendingCourseIds.has(r.id);
              return (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2">
                    <Link href={`/course/${r.id}`} className="font-medium hover:text-skillBlue">
                      {r.title}
                    </Link>
                  </td>
                  <td className="py-2 text-xs text-gray-500">{r.status}</td>
                  <td className="py-2">{r.sales}</td>
                  <td className="py-2">{r.enrollments}</td>
                  <td className="py-2 font-medium text-skillGreen">₹{r.teacherShare}</td>
                  <td className="py-2">{r.completion}%</td>
                  <td className="py-2">
                    {r.reviews > 0 ? (
                      <span className="text-skillYellow">
                        ★ {r.rating.toFixed(1)}{" "}
                        <span className="text-gray-400">({r.reviews})</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {session.role === "teacher" && (
                    <td className="py-2">
                      {hasCoursePending ? (
                        <span className="text-[11px] text-amber-600 font-semibold">Pending</span>
                      ) : (
                        <WithdrawCourseButton
                          courseId={r.id}
                          courseTitle={r.title}
                          available={courseAvail}
                        />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstructorAnalyticsPage;
