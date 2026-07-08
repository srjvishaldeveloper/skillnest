import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableActions from "@/components/TableActions";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Announcement, Class, Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import Link from "next/link";

type AnnouncementList = Announcement & { class: Class | null };

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const role = session?.role;
  const currentUserId = session?.userId;

  const columns = [
    { header: "Title", accessor: "title" },
    ...(role !== "student" && role !== "parent"
      ? [{ header: "Batch", accessor: "class" }]
      : []),
    { header: "Author", accessor: "author", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: AnnouncementList) => (
    <tr className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight" key={item.id}>
      <td className="flex items-center gap-4 p-4 font-medium">{item.title}</td>
      {role !== "student" && role !== "parent" && (
        <td>{item.class?.name || "All"}</td>
      )}
      <td className="hidden md:table-cell">
        {item.authorId && item.authorRole === "teacher" ? (
          <Link href={`/list/teachers/${item.authorId}`} className="text-skillBlue hover:underline font-medium">
            {item.authorName || "Teacher"}
          </Link>
        ) : item.authorRole === "admin" ? (
          <span className="font-medium text-gray-600">{item.authorName || "Admin"}</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="hidden md:table-cell">{new Intl.DateTimeFormat("en-US").format(item.date)}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AnnouncementWhereInput = {
    NOT: [
      { title: { contains: "course awaiting review", mode: "insensitive" } },
      { title: { contains: "Withdrawal request", mode: "insensitive" } },
      { title: { contains: "Payout request", mode: "insensitive" } },
      { title: { contains: "teacher registered", mode: "insensitive" } },
      { title: { contains: "registration", mode: "insensitive" } },
      { title: { contains: "Payout Completed", mode: "insensitive" } },
      { title: { contains: "Payout Cancelled", mode: "insensitive" } },
      { title: { contains: "Payout Transferred", mode: "insensitive" } },
    ],
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { authorName: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "classId":
            if (value === "all") {
              query.classId = null;
            } else {
              query.classId = parseInt(value);
            }
            break;
          default:
            break;
        }
      }
    }
  }

  // Role-based filtering
  if (role === "teacher" && currentUserId) {
    // Teachers see their own announcements + general ones
    query.OR = [
      { authorId: currentUserId },
      { classId: null, authorId: null },
    ];
  } else if (role === "student" && currentUserId) {
    // Students see admin announcements + only their enrolled teachers' announcements
    const enrolledTeacherIds = await prisma.enrollment.findMany({
      where: { studentId: currentUserId },
      select: { course: { select: { instructorId: true } } },
    });
    const tIds = Array.from(new Set(enrolledTeacherIds.map((e) => e.course.instructorId)));
    query.OR = [
      { authorRole: "admin" },
      ...(tIds.length > 0 ? [{ authorId: { in: tIds }, authorRole: "teacher" }] : []),
    ];
  } else if (role === "parent" && currentUserId) {
    // Parents see admin announcements + only their children's enrolled teachers' announcements
    const childrenIds = await prisma.student.findMany({
      where: { parentId: currentUserId },
      select: { id: true },
    });
    const enrolledTeacherIds = await prisma.enrollment.findMany({
      where: { studentId: { in: childrenIds.map((c) => c.id) } },
      select: { course: { select: { instructorId: true } } },
    });
    const tIds = Array.from(new Set(enrolledTeacherIds.map((e) => e.course.instructorId)));
    query.OR = [
      { authorRole: "admin" },
      ...(tIds.length > 0 ? [{ authorId: { in: tIds }, authorRole: "teacher" }] : []),
    ];
  }

  const sortOrder = searchParams.sort === "asc" ? "asc" : "desc";

  const [data, count, allClasses] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      orderBy: { date: sortOrder },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.announcement.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Announcements</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableActions batchOptions={(role === "admin" || role === "teacher") ? allClasses : undefined} />
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="announcement" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AnnouncementListPage;
