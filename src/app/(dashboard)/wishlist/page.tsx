import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import WishlistButton from "@/components/course/WishlistButton";

const WishlistPage = async () => {
  const session = await getSession();

  if (session?.role !== "student") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Wishlist</h1>
        <p className="mt-4 text-sm text-gray-400">
          Only learners can save courses to a wishlist.{" "}
          <Link href="/browse" className="text-skillBlue hover:underline">
            Browse courses →
          </Link>
        </p>
      </div>
    );
  }

  const wishes = await prisma.wishlist.findMany({
    where: { studentId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
  });

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Wishlist</h1>
        <Link href="/browse" className="text-sm font-medium text-skillBlue">
          Browse more →
        </Link>
      </div>

      {wishes.length === 0 && (
        <p className="mt-8 text-sm text-gray-400">
          Your wishlist is empty.{" "}
          <Link href="/browse" className="text-skillBlue hover:underline">
            Save some courses →
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {wishes.map(({ course }) => (
          <div
            key={course.id}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200"
          >
            <Link
              href={`/course/${course.id}`}
              className="relative block h-32 bg-gradient-to-br from-skillBlue/20 to-skillPurple/20"
            >
              {course.img && (
                <img src={course.img} alt="" className="w-full h-full object-cover" />
              )}
            </Link>
            <div className="flex flex-1 flex-col p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-skillPurple">
                  {course.category}
                </span>
                <WishlistButton courseId={course.id} initial={true} />
              </div>
              <Link href={`/course/${course.id}`}>
                <h3 className="mt-1 font-semibold leading-snug hover:text-skillBlue">
                  {course.title}
                </h3>
              </Link>
              <p className="mt-1 text-xs text-gray-500">
                {course.instructor.name}
              </p>
              <div className="mt-3 flex items-center">
                <span className="text-sm font-semibold text-skillBlue">
                  {course.price > 0 ? `₹${course.price}` : "Free"}
                </span>
                <Link
                  href={`/course/${course.id}`}
                  className="ml-auto rounded-md bg-skillBlue px-4 py-1.5 text-xs font-semibold text-white"
                >
                  View Course
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
