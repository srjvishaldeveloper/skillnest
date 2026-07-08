"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import ShareButton from "@/components/course/ShareButton";

type TeacherNode = {
  id: string;
  name: string;
  img: string | null;
  isParent: boolean;
  parentTeacher: { id: string; name: string } | null;
  _count: { courses: number; subTeachers: number };
  courses: { id: number; title: string; price: number; published: boolean; img: string | null; category: string; level: string; instructor: { name: string }; _count: { modules: number; enrollments: number } }[];
  subTeachers: TeacherNode[];
};

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").toLowerCase().trim();

  const [role, setRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isUnverified, setIsUnverified] = useState(false);
  const [parentTeachers, setParentTeachers] = useState<TeacherNode[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherNode | null>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "hasCourses" | "hasSubs">("hasCourses");

  useEffect(() => {
    fetch("/api/courses/admin-hierarchy")
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role);
        setUserId(d.userId);
        setIsUnverified(d.isUnverified);
        if (d.role === "admin") {
          setParentTeachers(d.parentTeachers);
          setAllCourses(d.allCourses);

          const teacherIdParam = searchParams.get("teacherId");
          if (teacherIdParam) {
            const found = d.parentTeachers.find((t: any) => t.id === teacherIdParam)
                       || d.parentTeachers.flatMap((t: any) => t.subTeachers || []).find((t: any) => t.id === teacherIdParam);
            if (found) {
              setSelectedTeacher(found);
            }
          }
        } else {
          setAllCourses(d.courses);
        }
      });
  }, [searchParams]);

  const filteredParentTeachers = parentTeachers.filter((pt) => {
    const matchesMode =
      filterMode === "hasCourses"
        ? pt._count.courses > 0
        : filterMode === "hasSubs"
        ? pt._count.subTeachers > 0
        : true;

    if (!matchesMode) return false;

    if (searchQuery) {
      const nameMatch = pt.name.toLowerCase().includes(searchQuery);
      const courseMatch = pt.courses.some((c) => c.title.toLowerCase().includes(searchQuery));
      return nameMatch || courseMatch;
    }

    return true;
  });

  const rawCoursesToShow = selectedTeacher
    ? [
        ...selectedTeacher.courses,
        ...selectedTeacher.subTeachers.flatMap((st) => st.courses),
      ]
    : role === "admin"
    ? allCourses
    : allCourses;

  const coursesToShow = rawCoursesToShow.filter((c) => {
    if (!searchQuery) return true;
    return (
      c.title.toLowerCase().includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery) ||
      c.instructor?.name?.toLowerCase().includes(searchQuery)
    );
  });

  if (!role) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex-1 space-y-6 p-6">
      {isUnverified && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span className="text-xl">⚠️</span>
          <div>
            <strong>Verification pending.</strong> Your instructor profile is under review.
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === "admin" && selectedTeacher
              ? `${selectedTeacher.name}'s Team Courses`
              : role === "admin"
              ? "All Courses"
              : "My Courses"}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {role === "admin" && selectedTeacher
              ? `Courses by ${selectedTeacher.name} and their sub-teachers`
              : "Manage, edit, and publish your educational content."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role === "admin" && selectedTeacher && (
            <button
              onClick={() => setSelectedTeacher(null)}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-2 rounded-lg"
            >
              ← All Courses
            </button>
          )}
          {role !== "admin" && !isUnverified && (
            <Link
              href="/courses/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <span>+</span> Create Course
            </Link>
          )}
        </div>
      </div>

      {/* Admin: Parent Teacher Grid with Filter Controls */}
      {role === "admin" && !selectedTeacher && parentTeachers.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">👨‍🏫 Parent Teachers</h2>
            
            {/* FILTER BUTTONS */}
            <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 text-xs">
              <button
                onClick={() => setFilterMode("hasCourses")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterMode === "hasCourses"
                    ? "bg-white text-skillBlue shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                With Courses Only ({parentTeachers.filter(p => p._count.courses > 0).length})
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterMode === "all"
                    ? "bg-white text-skillBlue shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Instructors ({parentTeachers.length})
              </button>
              <button
                onClick={() => setFilterMode("hasSubs")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterMode === "hasSubs"
                    ? "bg-white text-skillBlue shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                With Sub-teachers ({parentTeachers.filter(p => p._count.subTeachers > 0).length})
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredParentTeachers.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setSelectedTeacher(pt)}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-skillBlue transition text-left relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-skillBlue shrink-0 overflow-hidden">
                  {pt.img ? (
                    <img src={pt.img} alt={pt.name} className="w-full h-full object-cover" />
                  ) : (
                    pt.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-skillBlue transition">{pt.name}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-emerald-600">{pt._count.courses} courses</span> · {pt._count.subTeachers} sub-teachers
                  </p>
                </div>
              </button>
            ))}
          </div>

          {filteredParentTeachers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              No instructors match this filter or search query.
            </div>
          )}

          {coursesToShow.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-3 mt-8">📚 All Courses</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {coursesToShow.map((c: any) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Selected parent teacher's courses */}
      {role === "admin" && selectedTeacher && (
        <div>
          {selectedTeacher.subTeachers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-gray-500">Sub-teachers:</span>
              {selectedTeacher.subTeachers.map((st) => (
                <span key={st.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                  {st.name} ({st._count.courses} courses)
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coursesToShow.map((c: any) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
          {coursesToShow.length === 0 && (
            <div className="text-center py-12 text-gray-400">No courses found matching your search.</div>
          )}
        </div>
      )}

      {/* Non-admin or standalone teachers */}
      {role !== "admin" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coursesToShow.map((c: any) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}

      {allCourses.length === 0 && role !== "admin" && (
        <div className="my-12 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">📚</div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No Courses Yet</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {isUnverified
              ? "You cannot create courses until your profile is verified."
              : 'You haven\'t created any courses yet. Click "Create Course" to get started.'}
          </p>
          {!isUnverified && (
            <Link href="/courses/new" className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Start Creating →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-40 bg-gradient-to-br from-blue-100 to-indigo-100">
        {course.img && (
          <img src={course.img} alt={course.title} className="w-full h-full object-cover transition group-hover:scale-105" />
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${
            course.published
              ? "bg-emerald-500 text-white"
              : "bg-gray-800/80 text-white backdrop-blur-sm"
          }`}
        >
          {course.published ? "Published" : "Draft"}
        </span>
        <span className="absolute left-3 top-3">
          <ShareButton courseId={course.id} title={course.title} variant="icon" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
          {course.category} · {course.level}
        </span>
        <h3 className="mt-1.5 text-base font-bold leading-snug text-gray-900 group-hover:text-blue-600 transition">
          {course.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          by {course.instructor.name}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1.5 font-medium">📦 {course._count.modules} modules</span>
          <span className="flex items-center gap-1.5 font-medium">👥 {course._count.enrollments} learners</span>
          <span className="font-bold text-emerald-600 text-sm">
            {course.price > 0 ? `₹${course.price}` : "Free"}
          </span>
        </div>
      </div>
    </Link>
  );
}
