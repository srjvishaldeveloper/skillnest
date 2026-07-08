import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import WishlistButton from "@/components/course/WishlistButton";
import CartButton from "@/components/course/CartButton";
import ShareButton from "@/components/course/ShareButton";
import CourseHoverCard from "@/components/course/CourseHoverCard";
import Link from "next/link";

const Stars = ({ value }: { value: number }) => (
  <span className="text-skillYellow text-xs">
    {"★".repeat(Math.round(value))}
    <span className="text-gray-300">{"★".repeat(5 - Math.round(value))}</span>
  </span>
);

const BrowsePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const search = searchParams.search;
  const category = searchParams.category;

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      instructor: { select: { name: true } },
      reviews: { select: { rating: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let enrolledIds: number[] = [];
  let wishlistIds: number[] = [];
  let cartIds: number[] = [];
  if (session?.role === "student") {
    const [enrollments, wishes, cartItems] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: session.userId },
        select: { courseId: true },
      }),
      prisma.wishlist.findMany({
        where: { studentId: session.userId },
        select: { courseId: true },
      }),
      prisma.cart.findMany({
        where: { studentId: session.userId },
        select: { courseId: true },
      }),
    ]);
    enrolledIds = enrollments.map((e) => e.courseId);
    wishlistIds = wishes.map((w) => w.courseId);
    cartIds = cartItems.map((c) => c.courseId);
  }

  const allCategories = await prisma.course.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Browse Courses</h1>
        <form className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search courses..."
            className="bg-transparent text-sm outline-none"
          />
          <button className="text-xs font-medium text-skillBlue">Search</button>
        </form>
      </div>

      {/* category filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/browse"
          className={`rounded-full px-3 py-1 text-xs ${
            !category ? "bg-skillBlue text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          All
        </Link>
        {allCategories.map(({ category: cat }) => (
          <Link
            key={cat}
            href={`/browse?category=${encodeURIComponent(cat)}`}
            className={`rounded-full px-3 py-1 text-xs ${
              category === cat ? "bg-skillBlue text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <p className="mt-8 text-sm text-gray-400">No published courses found.</p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const enrolled = enrolledIds.includes(c.id);
          const ratingAvg = c.reviews.length
            ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
            : 0;

          return (
            <CourseHoverCard
              key={c.id}
              course={c}
              enrolled={enrolled}
              wishlisted={wishlistIds.includes(c.id)}
              inCart={cartIds.includes(c.id)}
              isStudent={session?.role === "student"}
            >
              {/* ── Actual card content ── */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 bg-white">
                <div className="relative h-36 bg-gradient-to-br from-skillBlue/20 to-skillPurple/20">
                  <Link href={`/course/${c.id}`} className="block w-full h-full">
                    {c.img && <img src={c.img} alt="" className="w-full h-full object-cover" />}
                  </Link>
                  <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                    {c.level}
                  </span>
                  <span className="absolute right-2 top-2">
                    <ShareButton courseId={c.id} title={c.title} variant="icon" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-skillPurple">
                      {c.category}
                    </span>
                    {session?.role === "student" && (
                      <div className="flex items-center gap-1">
                        {!enrolled && <CartButton courseId={c.id} />}
                        <WishlistButton courseId={c.id} initial={wishlistIds.includes(c.id)} />
                      </div>
                    )}
                  </div>
                  <Link href={`/course/${c.id}`}>
                    <h3 className="mt-1 font-semibold leading-snug hover:text-skillBlue line-clamp-2">
                      {c.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-xs text-gray-500">{c.instructor.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    {c.reviews.length > 0 ? (
                      <>
                        <Stars value={ratingAvg} />
                        <span>
                          {ratingAvg.toFixed(1)} ({c.reviews.length})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-300">No ratings yet</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>📦 {c._count.modules}</span>
                    <span>👥 {c._count.enrollments}</span>
                    <span className="ml-auto font-semibold text-skillBlue">
                      {c.price > 0 ? `₹${c.price}` : "Free"}
                    </span>
                  </div>
                  <div className="mt-4">
                    {enrolled ? (
                      <Link
                        href={`/learn/${c.id}`}
                        className="block w-full rounded-md bg-[#0a7a52] dark:bg-[#C5F82A] text-white dark:text-black px-4 py-2 text-center text-sm font-semibold shadow-sm hover:brightness-110 transition-all"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <Link
                        href={`/course/${c.id}`}
                        className="block w-full rounded-md bg-skillBlue px-4 py-2 text-center text-sm font-semibold text-white"
                      >
                        View Course
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CourseHoverCard>
          );
        })}
      </div>
    </div>
  );
};

export default BrowsePage;
