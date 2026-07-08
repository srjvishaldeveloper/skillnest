"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { ITEM_PER_PAGE } from "@/lib/settings";

type CourseItem = {
  id: number;
  title: string;
  createdAt: string;
  status: string;
  maxStudents: number | null;
  instructor: { name: string; id: string };
  _count: { enrollments: number };
  revenue: number;
};

type TeacherNode = {
  id: string;
  name: string;
  _count: { courses: number; subTeachers: number };
  courses: CourseItem[];
  subTeachers: TeacherNode[];
};

export default function ClassListPage() {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [parentTeachers, setParentTeachers] = useState<TeacherNode[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherNode | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/courses/batch-hierarchy")
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role);
        setUserId(d.userId);
        if (d.role === "admin") {
          setParentTeachers(d.parentTeachers);
        } else {
          setCourses(d.courses);
        }
      });
  }, []);

  const allCourses = selectedTeacher
    ? [
        ...selectedTeacher.courses,
        ...selectedTeacher.subTeachers.flatMap((st) => st.courses),
      ]
    : courses;

  const filtered = allCourses.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEM_PER_PAGE);

  const columns = [
    { header: "Batch Name", accessor: "name" },
    { header: "Capacity", accessor: "capacity", className: "hidden md:table-cell" },
    { header: "Year", accessor: "year" },
    { header: "Sales", accessor: "sales" },
    { header: "Revenue", accessor: "revenue", className: "hidden md:table-cell" },
    { header: "Supervisor", accessor: "supervisor", className: "hidden md:table-cell" },
  ];

  const renderRow = (item: CourseItem) => {
    const yr = new Date(item.createdAt).getFullYear();
    return (
      <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
        <td className="flex items-center gap-4 p-4">
          <Link href={`/courses/${item.id}`} className="font-semibold text-gray-900 hover:text-skillBlue">
            {item.title}
          </Link>
        </td>
        <td className="hidden md:table-cell">
          {item.maxStudents ? `${item._count.enrollments}/${item.maxStudents}` : "Unlimited"}
        </td>
        <td>{yr}</td>
        <td className="font-medium text-skillGreen">{item._count.enrollments}</td>
        <td className="hidden md:table-cell font-medium">₹{item.revenue.toLocaleString("en-IN")}</td>
        <td className="hidden md:table-cell">{item.instructor.name}</td>
      </tr>
    );
  };

  if (!role) return <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">Loading...</div>;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {role === "admin" && selectedTeacher
            ? `${selectedTeacher.name}'s Team Batches`
            : "All Batches"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="16" x2="3" y2="16"/><line x1="21" y1="8" x2="3" y2="8"/><line x1="21" y1="12" x2="3" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Admin: Parent Teacher Grid */}
      {role === "admin" && !selectedTeacher && (
        <div className="mt-6">
          {parentTeachers.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {parentTeachers.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setSelectedTeacher(pt)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-skillBlue transition text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-base font-bold text-skillBlue shrink-0">
                    {pt.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{pt.name}</p>
                    <p className="text-xs text-gray-500">
                      {pt._count.courses} courses · {pt._count.subTeachers} sub-teachers
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No parent teachers found.</div>
          )}
        </div>
      )}

      {/* Selected parent teacher */}
      {role === "admin" && selectedTeacher && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 block"
              >
                ← All Batches
              </button>
              <h2 className="text-lg font-bold text-gray-900">{selectedTeacher.name}</h2>
              {selectedTeacher.subTeachers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs text-gray-500">Sub-teachers:</span>
                  {selectedTeacher.subTeachers.map((st) => (
                    <span key={st.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {st.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Table columns={columns} renderRow={renderRow} data={paginated} />
          <Pagination page={page} count={totalPages} />
        </div>
      )}

      {/* Non-admin view */}
      {role !== "admin" && (
        <div className="mt-6">
          <Table columns={columns} renderRow={renderRow} data={paginated} />
          <Pagination page={page} count={totalPages} />
        </div>
      )}
    </div>
  );
}
