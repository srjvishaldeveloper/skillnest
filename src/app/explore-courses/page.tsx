import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import ShareButton from "@/components/course/ShareButton";

const NON_TECH_COURSE_CATEGORIES = [
  { icon: "🏥", label: "Healthcare & Nursing", category: "Healthcare" },
  { icon: "🏦", label: "Banking & Finance", category: "Banking" },
  { icon: "📚", label: "Teaching / CTET", category: "Education" },
  { icon: "🔧", label: "ITI & Skilled Trades", category: "ITI Trades" },
  { icon: "🚚", label: "Logistics & Supply Chain", category: "Logistics" },
  { icon: "🏪", label: "Sales & Retail", category: "Sales" },
  { icon: "🏛️", label: "Govt Exam Prep", category: "Government" },
  { icon: "📞", label: "Customer Service / BPO", category: "Customer Service" },
];

const ExploreCoursesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
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

  const allCategories = await prisma.course.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <div className="min-h-screen bg-[#171b12] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-300">
                Public Catalog
              </span>
              <h1 className="mt-4 text-4xl font-extrabold">Explore All Courses</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70">
                Published courses from the SkillNest platform appear here automatically.
                Super admin can add or publish courses and they will show on this page and
                the landing page course section.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Landing
            </Link>
          </div>
        </div>

        {/* Non-tech quick-access category strip */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">
            Popular Non-Tech Courses
          </p>
          <div className="flex flex-wrap gap-2">
            {NON_TECH_COURSE_CATEGORIES.map((cat) => (
              <Link
                key={cat.category}
                href={`/explore-courses?category=${encodeURIComponent(cat.category)}`}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <span>{cat.icon}</span> {cat.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white p-5 text-skillDark">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Browse Published Courses</h2>
            <form className="flex flex-wrap items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
              <input
                name="search"
                defaultValue={search}
                placeholder="Search courses..."
                className="bg-transparent text-sm outline-none"
              />
              <button className="text-xs font-semibold text-skillBlue">Search</button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/explore-courses"
              className={`rounded-full px-3 py-1 text-xs ${
                !category ? "bg-skillBlue text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              All
            </Link>
            {allCategories.map(({ category: item }) => (
              <Link
                key={item}
                href={`/explore-courses?category=${encodeURIComponent(item)}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  category === item ? "bg-skillBlue text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>

          {courses.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No published courses found yet.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const ratingAvg = course.reviews.length
                  ? course.reviews.reduce((sum, review) => sum + review.rating, 0) /
                    course.reviews.length
                  : 0;

                return (
                  <div
                    key={course.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-44 bg-gradient-to-br from-skillBlue/20 to-skillPurple/20">
                      {course.img && <img src={course.img} alt="" className="w-full h-full object-cover" />}
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                        {course.level}
                      </span>
                      <span className="absolute right-3 top-3">
                        <ShareButton courseId={course.id} title={course.title} variant="icon" />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[10px] uppercase tracking-wide text-skillPurple">
                        {course.category}
                      </span>
                      <h3 className="mt-1 text-lg font-semibold">{course.title}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {course.instructor.name}
                      </p>
                      <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                        {course.description || "Career-focused learning path from SkillNest."}
                      </p>
                      <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                        <span>{course._count.modules} modules</span>
                        <span>{course._count.enrollments} learners</span>
                        <span className="ml-auto">
                          {course.reviews.length > 0
                            ? `${ratingAvg.toFixed(1)} (${course.reviews.length})`
                            : "No ratings"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-lg font-bold text-skillBlue">
                          {course.price > 0 ? `₹${course.price}` : "Free"}
                        </span>
                        <Link
                          href="/register"
                          className="ml-auto rounded-full bg-skillBlue px-4 py-2 text-sm font-semibold text-white"
                        >
                          Enroll / Sign Up
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreCoursesPage;
