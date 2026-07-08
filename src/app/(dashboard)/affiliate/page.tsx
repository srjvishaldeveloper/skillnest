import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const Stat = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    <div className="mt-1 text-xs text-gray-500">{label}</div>
  </div>
);

const AffiliatePage = async () => {
  const session = await getSession();
  if (session?.role !== "affiliate") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Affiliate</h1>
        <p className="mt-4 text-sm text-gray-400">Affiliate partners only.</p>
      </div>
    );
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: session.userId },
    include: {
      referrals: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!affiliate) return null;

  const totalEarnings = affiliate.referrals.reduce((s, r) => s + r.commission, 0);
  const referralLink = `${APP_URL}/browse?ref=${affiliate.code}`;

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <div className="rounded-3xl bg-skillDark px-6 py-5 text-white">
        <h1 className="text-xl font-semibold">Welcome, {affiliate.name} 👋</h1>
        <p className="mt-1 text-sm text-white/70">
          Promote SkillNest courses and earn {affiliate.commissionRate}% on every sale.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Stat label="Total Earnings" value={`₹${totalEarnings}`} accent="text-skillGreen" />
        <Stat label="Conversions" value={String(affiliate.referrals.length)} accent="text-skillBlue" />
        <Stat label="Commission Rate" value={`${affiliate.commissionRate}%`} accent="text-skillPurple" />
      </div>

      {/* referral tools */}
      <div className="rounded-md bg-white p-5">
        <h2 className="font-semibold">Your referral link</h2>
        <p className="mt-1 text-xs text-gray-400">
          Share this link. Any course bought through it earns you commission.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 truncate rounded-md bg-gray-50 px-3 py-2 text-sm text-skillBlue">
            {referralLink}
          </code>
          <span className="rounded-md bg-skillLight px-3 py-2 text-sm">
            Code: <b>{affiliate.code}</b>
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Tip: append <code>?ref={affiliate.code}</code> to any course link too.
        </p>
      </div>

      {/* earnings table */}
      <div className="rounded-md bg-white p-5">
        <h2 className="font-semibold">Recent commissions</h2>
        {affiliate.referrals.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">
            No conversions yet. Start sharing your link!
          </p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="py-2">Date</th>
                <th className="py-2">Course ID</th>
                <th className="py-2">Order</th>
                <th className="py-2">Commission</th>
              </tr>
            </thead>
            <tbody>
              {affiliate.referrals.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2">{new Intl.DateTimeFormat("en-GB").format(r.createdAt)}</td>
                  <td className="py-2">#{r.courseId ?? "—"}</td>
                  <td className="py-2">#{r.orderId ?? "—"}</td>
                  <td className="py-2 font-medium text-skillGreen">₹{r.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AffiliatePage;
