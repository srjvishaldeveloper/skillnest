import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { getSession } from "@/lib/auth";

type AssignmentList = Assignment & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
  results: {
    student: {
      id: string;
      name: string;
      username: string;
      img: string | null;
    };
  }[];
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const session = await getSession();
  const role = session?.role;
  const currentUserId = session?.userId;
  
  const columns = [
    {
      header: "Project Title",
      accessor: "title",
    },
    {
      header: "Course / Batch",
      accessor: "name",
    },
    {
      header: "Instructor",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
    {
      header: "Submitted Students",
      accessor: "submissions",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];
  
  const renderRow = (item: AssignmentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50/50 transition"
    >
      <td className="p-4">
        <span className="font-bold text-gray-900">{item.title}</span>
      </td>
      <td>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{item.lesson.subject.name}</span>
          <span className="text-xs text-gray-500">Batch: {item.lesson.class.name}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.lesson.teacher.name}
      </td>
      <td className="hidden md:table-cell">
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(item.dueDate))}
        </span>
      </td>
      <td>
        <div className="flex flex-col gap-1 py-2">
          {item.results && item.results.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
              {item.results.map((r, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200"
                  title={`Submitted by ${r.student.name} (@${r.student.username})`}
                >
                  <span>✓</span>
                  <span className="truncate max-w-[90px]">{r.student.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">No submissions yet</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormContainer table="assignment" type="update" data={item} />
              <FormContainer table="assignment" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.AssignmentWhereInput = {};

  query.lesson = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = parseInt(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
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

  // ROLE CONDITIONS

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.lesson.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        results: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
                username: true,
                img: true,
              },
            },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);
  return (
    <div className="bg-white p-6 rounded-2xl flex-1 m-4 mt-0 shadow-sm border border-gray-100">
      {/* TOP */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Projects & Assignments
          </h1>
          <p className="text-xs text-gray-500">Manage student projects, deadlines, and submissions.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end">
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="assignment" type="create" />
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

export default AssignmentListPage;
