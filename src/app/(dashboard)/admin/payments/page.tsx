import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CourseCard from "./CourseCard";

const AdminPaymentsPage = async () => {
  const session = await getSession();
  if (session?.role !== "admin") {
    return <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6"><h1 className="text-lg font-semibold">Payments</h1><p className="mt-4 text-sm text-gray-400">Admins only.</p></div>;
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: true,
      course: {
        select: {
          title: true,
          instructor: true,
        },
      },
    },
  });

  // Group by course
  const grouped: Record<string, { courseTitle: string; instructor: typeof orders[0]["course"]["instructor"]; buyers: typeof orders[0]["student"][] }> = {};
  for (const o of orders) {
    const key = o.course.title;
    if (!grouped[key]) {
      grouped[key] = { courseTitle: key, instructor: o.course.instructor, buyers: [] };
    }
    if (!grouped[key].buyers.some((b) => b.id === o.student.id)) {
      grouped[key].buyers.push(o.student);
    }
  }

  const courses = Object.values(grouped);

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6">
      <h1 className="text-lg font-semibold">Payment Management</h1>

      {courses.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-400 py-8">No purchases yet.</p>
        </div>
      )}

      {courses.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">Courses &amp; Buyers ({courses.length})</h2>
          <div className="flex flex-col gap-3">
            {courses.map((c) => (
              <CourseCard
                key={c.courseTitle}
                courseTitle={c.courseTitle}
                instructor={c.instructor}
                buyers={c.buyers}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
