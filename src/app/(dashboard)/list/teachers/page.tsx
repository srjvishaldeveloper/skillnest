import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableActions from "@/components/TableActions";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { approveTeacherAction } from "@/lib/courseActions";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const role = session?.role;

  const teacherSelf = role === "teacher" && session?.userId
    ? await prisma.teacher.findUnique({ where: { id: session.userId }, select: { parentTeacherId: true, id: true } })
    : null;

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Instructor ID",
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
    {
      header: "Courses",
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: "Batches",
      accessor: "classes",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Verified",
            accessor: "verified",
            className: "hidden md:table-cell",
          },
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <img
          src={item.img || "/noAvatar.png"}
          alt=""
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">
        {item.subjects.map((subject) => subject.name).join(",")}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((classItem) => classItem.name).join(",")}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">{item.address}</td>
      {role === "admin" && (
        <td className="hidden md:table-cell">
          {item.isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
              Pending
            </span>
          )}
        </td>
      )}
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && !item.isVerified && (
            <form action={approveTeacherAction}>
              <input type="hidden" name="teacherId" value={item.id} />
              <button
                type="submit"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 transition"
                title="Verify teacher"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </form>
          )}
          {role === "admin" && (
            <FormContainer table="teacher" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.TeacherWhereInput = {};

  if (role === "teacher" && teacherSelf) {
    query.parentTeacherId = teacherSelf.id;
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lessons = {
              some: {
                classId: parseInt(value),
              },
            };
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { username: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "verified":
            if (value === "true") query.isVerified = true;
            if (value === "false") query.isVerified = false;
            break;
          default:
            break;
        }
      }
    }
  }

  const sortOrder = searchParams.sort === "asc" ? "asc" : "desc";

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      orderBy: { name: sortOrder },
      include: {
        subjects: true,
        classes: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.teacher.count({ where: query }),
  ]);

  const teacherFilterOptions = [
    { label: "All Instructors", value: "" },
    { label: "Verified Only", key: "verified", value: "true" },
    { label: "Pending Verification", key: "verified", value: "false" },
  ];

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Instructors</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableActions filterOptions={teacherFilterOptions} />
            {role === "admin" && (
              <FormContainer table="teacher" type="create" />
            )}
            {(role === "admin" || role === "teacher") && (
              <Link href="/list/invite-teachers" className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow text-lg font-bold text-black">
                +
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;
