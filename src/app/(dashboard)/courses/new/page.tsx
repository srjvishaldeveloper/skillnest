import Link from "next/link";
import CourseForm from "@/components/course/CourseForm";

const NewCoursePage = () => {
  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/courses" className="text-gray-400 hover:underline">
          My Courses
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">Create Course</span>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Create a new course</h1>
      <CourseForm type="create" />
    </div>
  );
};

export default NewCoursePage;
