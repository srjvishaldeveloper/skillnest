import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import SubTeacherPayoutModal from "./SubTeacherPayoutModal";
import TeacherProfileModal from "../../admin/payouts/TeacherProfileModal";

const ParentTeacherPayoutsPage = async () => {
  const session = await getSession();
  if (session?.role !== "teacher") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Sub-Teacher Payouts</h1>
        <p className="mt-4 text-sm text-gray-400">Instructors only.</p>
      </div>
    );
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.userId },
    select: {
      _count: { select: { subTeachers: true } },
    },
  });

  const isParentTeacher = (teacher?._count?.subTeachers ?? 0) > 0;

  if (!isParentTeacher) {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white dark:bg-[#121214] p-6 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white">
        <h1 className="text-lg font-bold">Sub-Teacher Payouts</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">You currently do not have any registered sub-teachers associated with your account.</p>
      </div>
    );
  }

  const pendingRequests = await prisma.withdrawalRequest.findMany({
    where: {
      teacher: { parentTeacherId: session.userId },
      paidToSubAt: null,
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

  const historyRequests = await prisma.withdrawalRequest.findMany({
    where: {
      teacher: { parentTeacherId: session.userId },
      paidToSubAt: { not: null },
    },
    orderBy: { paidToSubAt: "desc" },
    take: 20,
    include: {
      teacher: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sub-Teacher Payout Management</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Approve, cut service charges, and disburse payouts to your sub-instructors.</p>
        </div>
      </div>

      {/* Pending Requests Section */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-6 text-gray-900 dark:text-white shadow-sm">
        <h2 className="font-bold text-base mb-4 text-gray-900 dark:text-white">Pending Requests ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-400 italic">No pending sub-teacher payout requests.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50 dark:bg-[#18181B] p-4 text-gray-900 dark:text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">{req.teacher.name}</p>
                      <TeacherProfileModal teacherId={req.teacherId} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{req.teacher.email}</p>

                    {/* Sub Teacher Bank details */}
                    {(req.teacher.bankName || req.teacher.upiId) && (
                      <div className="mt-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-3 py-2 text-xs text-gray-700 dark:text-zinc-300 inline-block">
                        <p className="font-bold text-blue-700 dark:text-blue-400 mb-0.5">🏦 Sub-Teacher Bank Account & UPI</p>
                        {req.teacher.accountHolderName && <span className="font-semibold text-gray-900 dark:text-white">{req.teacher.accountHolderName}</span>}
                        {req.teacher.bankName && <span className="text-gray-800 dark:text-zinc-200"> · {req.teacher.bankName}{req.teacher.accountNumber ? ` (${req.teacher.accountNumber})` : ""}</span>}
                        {req.teacher.ifsc && <><br /><span className="font-mono text-gray-600 dark:text-zinc-400">IFSC: {req.teacher.ifsc}</span></>}
                        {req.teacher.upiId && <><br /><span className="font-semibold text-emerald-600 dark:text-emerald-400">UPI ID: {req.teacher.upiId}</span></>}
                      </div>
                    )}

                    <div className="mt-3 flex gap-4 text-sm flex-wrap">
                      <span>Gross Requested: <strong>₹{req.amount}</strong></span>
                      <span>Net to Sub: <strong className="text-skillGreen dark:text-emerald-400">₹{req.netAmount}</strong></span>
                    </div>

                    <div className="mt-1.5 flex gap-2 text-xs flex-wrap">
                      <span className={`font-semibold ${req.parentApproved ? "text-skillGreen dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}>
                        {req.parentApproved ? "✓ Your Approval Granted" : "⚠️ Awaiting Your Approval"}
                      </span>
                      {req.status === "PROCESSED" && (
                        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-[11px]">
                          Admin Processed & Transferred to You
                        </span>
                      )}
                    </div>
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
        )}
      </div>

      {/* History Section */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-6 text-gray-900 dark:text-white shadow-sm">
        <h2 className="font-bold text-base mb-4 text-gray-900 dark:text-white">Sub-Teacher Transfer History</h2>
        {historyRequests.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-400 italic">No completed sub-teacher payouts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-left text-xs text-gray-400 dark:text-zinc-400">
                  <th className="py-2.5">Sub-Teacher</th>
                  <th className="py-2.5">Gross</th>
                  <th className="py-2.5">Net Transferred</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Transferred At</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 dark:border-zinc-800/60">
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white">{req.teacher.name}</span>
                        <TeacherProfileModal teacherId={req.teacherId} />
                      </div>
                    </td>
                    <td className="py-3 font-medium">₹{req.amount}</td>
                    <td className="py-3 font-bold text-skillGreen dark:text-emerald-400">₹{req.netAmount}</td>
                    <td className="py-3">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Transferred ✓
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-400 dark:text-zinc-400">
                      {req.paidToSubAt ? new Date(req.paidToSubAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentTeacherPayoutsPage;
