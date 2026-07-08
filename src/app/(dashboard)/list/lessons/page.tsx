import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";

type CourseWithData = {
  id: number;
  title: string;
  createdAt: Date;
  status: string;
  instructor: { name: string; id: string };
  _count: { enrollments: number };
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const role = session?.role;

  const columns = [
    { header: "Course", accessor: "name" },
    { header: "Batch", accessor: "class" },
    { header: "Session Year", accessor: "year", className: "hidden md:table-cell" },
    { header: "Revenue Generated", accessor: "revenue" },
    { header: "Instructor", accessor: "teacher", className: "hidden md:table-cell" },
    ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.CourseWhereInput = {};

  const currentUserId = session?.userId;

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            break;
          case "teacherId":
            query.instructorId = value;
            break;
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin":
      break;
    case "teacher":
      if (currentUserId) query.instructorId = currentUserId;
      break;
    case "student":
      if (currentUserId) {
        query.enrollments = { some: { studentId: currentUserId } };
      }
      break;
    case "parent":
      if (currentUserId) {
        query.enrollments = { some: { studentId: currentUserId } };
      }
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.course.findMany({
      where: query,
      include: {
        instructor: { select: { name: true, id: true } },
        _count: { select: { enrollments: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where: query }),
  ]);

  const courseIds = data.map((c) => c.id);
  const revenueRows = courseIds.length
    ? await prisma.order.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds }, status: "PAID" },
        _sum: { amount: true },
      })
    : [];
  const revenueByCourse = new Map(revenueRows.map((r) => [r.courseId, r._sum.amount || 0]));

  const renderRow = (item: CourseWithData) => {
    const yr = new Date(item.createdAt).getFullYear();
    const sessionYear = `${yr}-${(yr + 1).toString().slice(-2)}`;
    const rev = revenueByCourse.get(item.id) || 0;
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4 font-semibold text-gray-900">{item.title}</td>
        <td>{item._count.enrollments > 0 ? `Batch ${yr}` : "No batch"}</td>
        <td className="hidden md:table-cell">
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
            📅 {sessionYear} Batch
          </span>
        </td>
        <td>
          <div className="flex flex-col">
            <span className="font-bold text-emerald-600 text-sm">
              ₹{rev.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              {item._count.enrollments > 0 ? `${item._count.enrollments} course enrollments` : "0 enrollments"}
            </span>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.instructor.name}</td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <FormContainer table="lesson" type="update" data={{ ...item, subject: { name: item.title } }} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl flex-1 m-4 mt-0 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Sessions</h1>
          <p className="text-xs text-gray-500">View session schedules, real database sales revenue, and assigned instructors.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
