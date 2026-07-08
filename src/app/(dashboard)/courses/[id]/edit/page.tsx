import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CourseForm from "@/components/course/CourseForm";

const EditCoursePage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const session = await getSession();
  const course = await prisma.course.findUnique({
    where: { id: parseInt(id) },
  });

  if (!course) return notFound();
  if (session?.role === "teacher" && course.instructorId !== session.userId) {
    return notFound();
  }

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href={`/courses/${course.id}`} className="text-gray-400 hover:underline">
          {course.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">Edit Details</span>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Edit course</h1>
      <CourseForm
        type="update"
        priceDisabled={session?.role === "admin"}
        data={{
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          img: course.img ?? "",
          trailerUrl: course.trailerUrl ?? "",
          outcomes: course.outcomes.join("\n"),
        }}
      />
    </div>
  );
};

export default EditCoursePage;
