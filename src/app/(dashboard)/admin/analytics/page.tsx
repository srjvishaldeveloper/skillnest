import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Stat = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    <div className="mt-1 text-xs text-gray-500">{label}</div>
  </div>
);

const AdminAnalyticsPage = async () => {
  const session = await getSession();
  if (session?.role !== "admin") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Platform Analytics</h1>
        <p className="mt-4 text-sm text-gray-400">Admins only.</p>
      </div>
    );
  }

  const [learners, instructors, publishedCourses, paidAgg, paidOrders, topByEnroll] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.order.findMany({
        where: { status: "PAID" },
        include: {
          course: {
            select: {
              title: true,
              instructor: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { enrollments: { _count: "desc" } },
        take: 5,
        include: {
          instructor: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      }),
    ]);

  const totalRevenue = paidAgg._sum.amount || 0;

  // top instructors by revenue
  const instrRevenue = new Map<
    string,
    { name: string; revenue: number; sales: number }
  >();
  paidOrders.forEach((o) => {
    const ins = o.course.instructor;
    const key = ins.id;
    const cur = instrRevenue.get(key) || {
      name: ins.name,
      revenue: 0,
      sales: 0,
    };
    cur.revenue += o.amount;
    cur.sales += 1;
    instrRevenue.set(key, cur);
  });
  const topInstructors = Array.from(instrRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <h1 className="text-lg font-semibold">Platform Analytics</h1>

      <div className="flex flex-wrap gap-4">
        <Stat label="Total Learners" value={String(learners)} accent="text-skillBlue" />
        <Stat label="Total Instructors" value={String(instructors)} accent="text-skillPurple" />
        <Stat label="Published Courses" value={String(publishedCourses)} accent="text-skillYellow" />
        <Stat label="Total Revenue" value={`₹${totalRevenue}`} accent="text-skillGreen" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* top courses */}
        <div className="rounded-md bg-white p-4">
          <h2 className="font-semibold">Top Courses by Enrollment</h2>
          {topByEnroll.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No courses yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {topByEnroll.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="mr-2 text-gray-400">#{i + 1}</span>
                    <Link href={`/course/${c.id}`} className="font-medium hover:text-skillBlue">
                      {c.title}
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">
                      {c.instructor.name}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-skillBlue">
                    👥 {c._count.enrollments}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* top instructors */}
        <div className="rounded-md bg-white p-4">
          <h2 className="font-semibold">Top Instructors by Revenue</h2>
          {topInstructors.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No paid sales yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {topInstructors.map((t, i) => (
                <li
                  key={t.name}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="mr-2 text-gray-400">#{i + 1}</span>
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{t.sales} sales</span>
                  </span>
                  <span className="text-xs font-medium text-skillGreen">₹{t.revenue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
