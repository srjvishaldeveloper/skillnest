import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PayoutActions from "./PayoutActions";
import TeacherProfileModal from "./TeacherProfileModal";
import BillViewerModal from "./BillViewerModal";

const AdminPayoutsPage = async () => {
  const session = await getSession();
  if (session?.role !== "admin") {
    return <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6"><h1 className="text-lg font-semibold">Payouts</h1><p className="mt-4 text-sm text-gray-400">Admins only.</p></div>;
  }

  const pendingRequests = await prisma.withdrawalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      teacher: {
        include: {
          parentTeacher: {
            select: {
              id: true,
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
      },
      course: { select: { id: true, title: true } },
    },
  });

  const processedRequests = await prisma.withdrawalRequest.findMany({
    where: { status: { in: ["PROCESSED", "REJECTED"] } },
    orderBy: { processedAt: "desc" },
    take: 20,
    include: { teacher: { select: { name: true } }, course: { select: { title: true } } },
  });

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6">
      <h1 className="text-lg font-semibold">Teacher Payouts</h1>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-6 text-gray-900 dark:text-white">
        <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Pending Requests ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-400">No pending payout requests.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingRequests.map((req) => {
              const activeBank = req.teacher.parentTeacher || req.teacher;
              return (
                <div key={req.id} className="rounded-lg border border-gray-100 dark:border-zinc-800/80 bg-gray-50 dark:bg-[#18181B] p-4 text-gray-900 dark:text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-white">{req.teacher.name}</p>
                        <TeacherProfileModal teacherId={req.teacherId} />
                        {req.course && (
                          <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-500/30">
                            Course: {req.course.title}
                          </span>
                        )}
                        {req.teacher.parentTeacher && (
                          <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200/50 dark:border-purple-500/30">
                            Sub-Teacher of {req.teacher.parentTeacher.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{req.teacher.email}</p>

                      {/* Bank Details Display */}
                      {(activeBank.bankName || activeBank.upiId) && (
                        <div className="mt-2 rounded bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-3 py-2 text-xs text-gray-700 dark:text-zinc-300 inline-block">
                          <p className="font-bold text-blue-700 dark:text-blue-400 mb-0.5">
                            {req.teacher.parentTeacher ? `💳 Pay to Parent Teacher: ${req.teacher.parentTeacher.name}` : "🏦 Recipient Bank Details"}
                          </p>
                          {activeBank.accountHolderName && <span className="font-semibold text-gray-900 dark:text-white">{activeBank.accountHolderName}</span>}
                          {activeBank.bankName && <span className="text-gray-800 dark:text-zinc-200"> · {activeBank.bankName}{activeBank.accountNumber ? ` (${activeBank.accountNumber})` : ""}</span>}
                          {activeBank.ifsc && <><br /><span className="font-mono text-gray-600 dark:text-zinc-400">IFSC: {activeBank.ifsc}</span></>}
                          {activeBank.upiId && <><br /><span className="font-semibold text-emerald-600 dark:text-emerald-400">UPI ID: {activeBank.upiId}</span></>}
                        </div>
                      )}

                      <div className="mt-2 flex gap-4 text-sm">
                        <span>Gross: <strong>₹{req.amount}</strong></span>
                        <span>Platform Fee ({req.platformFeePercent}%): <strong className="text-gray-500">-₹{req.platformFee}</strong></span>
                        <span>Net: <strong className="text-skillGreen">₹{req.netAmount}</strong></span>
                      </div>
                      <div className="mt-1 flex gap-2 text-xs">
                        {req.parentApproved ? (
                          <span className="text-skillGreen font-medium">Parent Approved ✓</span>
                        ) : req.teacher.parentTeacherId ? (
                          <span className="text-skillYellow font-medium">Awaiting Parent Approval</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                    <PayoutActions
                      requestId={req.id}
                      teacherName={req.teacher.name}
                      teacherEmail={req.teacher.email}
                      bankDetails={{
                        accountHolderName: req.teacher.accountHolderName,
                        bankName: req.teacher.bankName,
                        accountNumber: req.teacher.accountNumber,
                        ifsc: req.teacher.ifsc,
                        upiId: req.teacher.upiId,
                      }}
                      parentTeacherInfo={req.teacher.parentTeacher ? {
                        name: req.teacher.parentTeacher.name,
                        email: req.teacher.parentTeacher.email,
                        accountHolderName: req.teacher.parentTeacher.accountHolderName,
                        bankName: req.teacher.parentTeacher.bankName,
                        accountNumber: req.teacher.parentTeacher.accountNumber,
                        ifsc: req.teacher.parentTeacher.ifsc,
                        upiId: req.teacher.parentTeacher.upiId,
                      } : null}
                      amount={req.amount}
                      platformFee={req.platformFee}
                      netAmount={req.netAmount}
                      platformFeePercent={req.platformFeePercent}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold mb-4">History</h2>
        {processedRequests.length === 0 ? (
          <p className="text-sm text-gray-400">No history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                  <th className="py-2">Teacher</th>
                  <th className="py-2">Gross</th>
                  <th className="py-2">Fee</th>
                  <th className="py-2">Net</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Bill</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100">
                    <td className="py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{req.teacher.name}</span>
                        <TeacherProfileModal teacherId={req.teacherId} />
                        {req.course && (
                          <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            {req.course.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2">₹{req.amount}</td>
                    <td className="py-2 text-red-500">-₹{req.platformFee}</td>
                    <td className="py-2 font-medium text-skillGreen">₹{req.netAmount}</td>
                    <td className="py-2">
                      <span className={`text-xs font-medium ${req.status === "PROCESSED" ? "text-skillGreen" : "text-red-500"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {req.billUrl ? (
                        <BillViewerModal billUrl={req.billUrl} teacherName={req.teacher.name} />
                      ) : "—"}
                    </td>
                    <td className="py-2 text-xs text-gray-400">{req.processedAt ? new Date(req.processedAt).toLocaleString() : "—"}</td>
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

export default AdminPayoutsPage;
