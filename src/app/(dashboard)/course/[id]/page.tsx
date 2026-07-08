import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import EnrollButton from "@/components/course/EnrollButton";
import CartButton from "@/components/course/CartButton";
import WishlistButton from "@/components/course/WishlistButton";
import ShareButton from "@/components/course/ShareButton";
import ReviewForm from "@/components/course/ReviewForm";
import FaqAccordion from "@/components/course/FaqAccordion";
import { getEmbedUrl } from "@/lib/videoEmbed";

const Stars = ({ value }: { value: number }) => (
  <span className="text-skillYellow">
    {"★".repeat(Math.round(value))}
    <span className="text-gray-300">{"★".repeat(5 - Math.round(value))}</span>
  </span>
);

const CourseDetailPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const session = await getSession();
  const courseId = parseInt(id);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: {
        select: {
          name: true,
          img: true,
          email: true,
          _count: { select: { courses: true } },
        },
      },
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { student: { select: { name: true } } },
      },
      faqs: { orderBy: { order: "asc" } },
      certificates: { take: 1 },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) return notFound();

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalMins = course.modules.reduce(
    (s, m) => s + m.lessons.reduce((a, l) => a + l.duration, 0),
    0
  );
  const ratingAvg = course.reviews.length
    ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
    : 0;

  const durationStr =
    totalMins > 60
      ? `${Math.round(totalMins / 60)}h ${totalMins % 60}m`
      : `${totalMins}m`;

  // current student state
  let enrolled = false;
  let wishlisted = false;
  let myReview: { rating: number; comment: string } | null = null;
  let hasCertificate = false;
  if (session?.role === "student") {
    const [e, w, r, c] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.userId, courseId } },
      }),
      prisma.wishlist.findUnique({
        where: { studentId_courseId: { studentId: session.userId, courseId } },
      }),
      prisma.review.findUnique({
        where: { studentId_courseId: { studentId: session.userId, courseId } },
      }),
      prisma.certificate.findUnique({
        where: { studentId_courseId: { studentId: session.userId, courseId } },
      }),
    ]);
    enrolled = !!e;
    wishlisted = !!w;
    myReview = r ? { rating: r.rating, comment: r.comment } : null;
    hasCertificate = !!c;
  }

  const embed = course.trailerUrl ? getEmbedUrl(course.trailerUrl) : null;

  // Related courses in same category
  const relatedCourses = await prisma.course.findMany({
    where: {
      published: true,
      id: { not: courseId },
      ...(course.category ? { category: course.category } : {}),
    },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6 pb-8">
      {/* ═══════════════ 1. COURSE BANNER ═══════════════ */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-skillDark to-gray-900">
        {course.img ? (
          <div className="relative h-64 md:h-80 w-full">
            <Image
              src={course.img}
              alt={course.title}
              fill
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-skillDark/90 via-skillDark/50 to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {/* ═══════════════ 2. COURSE TITLE ═══════════════ */}
          <span className="inline-block rounded-full bg-skillYellow/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-skillYellow mb-2">
            {course.category} · {course.level}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">
            {course.title}
          </h1>

          {/* ═══════════════ 3. RATING | STUDENTS | DURATION ═══════════════ */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Stars value={ratingAvg} />
              <span>
                {ratingAvg.toFixed(1)} ({course.reviews.length} reviews)
              </span>
            </span>
            <span className="text-white/40">|</span>
            <span>👥 {course._count.enrollments} students</span>
            <span className="text-white/40">|</span>
            <span>
              📦 {course.modules.length} modules · {totalLessons} lessons
            </span>
            <span className="text-white/40">|</span>
            <span>⏱ {durationStr}</span>
          </div>

          {/* ═══════════════ 4. ENROLL + WISHLIST ═══════════════ */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {enrolled ? (
              <>
                <Link
                  href={`/learn/${course.id}`}
                  className="rounded-lg bg-[#0a7a52] dark:bg-[#C5F82A] text-white dark:text-black px-6 py-2.5 text-sm font-semibold shadow-lg hover:brightness-110 transition"
                >
                  Continue Learning →
                </Link>
                <Link
                  href={`/messages`}
                  className="rounded-lg border border-skillBlue px-4 py-2.5 text-sm font-semibold text-skillBlue hover:bg-skillBlue/5 transition"
                >
                  💬 Talk to Teacher
                </Link>
              </>
            ) : session?.role === "student" ? (
              <EnrollButton courseId={course.id} price={course.price} />
            ) : (
              <Link
                href={`/learn/${course.id}`}
                className="rounded-lg bg-skillBlue px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-skillBlue/90 transition"
              >
                Preview Course
              </Link>
            )}
            {session?.role === "student" && !enrolled && course.price > 0 && (
              <CartButton courseId={course.id} variant="full" />
            )}
            {session?.role === "student" && (
              <WishlistButton
                courseId={course.id}
                initial={wishlisted}
                variant="full"
              />
            )}
            <ShareButton courseId={course.id} title={course.title} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ═══════════ LEFT COLUMN ═══════════ */}
        <div className="flex-1 flex flex-col gap-6">
          {/* ═══════════════ 5. COURSE OVERVIEW ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Course Overview
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {course.description || "No description available yet."}
            </p>
            {course.outcomes.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-gray-700">
                  What you&apos;ll learn
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {course.outcomes.map((o, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <span className="mt-0.5 text-skillGreen">✓</span> {o}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ═══════════════ 6. CURRICULUM ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Curriculum
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {course.modules.length} modules · {totalLessons} lessons ·{" "}
              {durationStr} total
            </p>
            <div className="flex flex-col gap-3">
              {course.modules.map((m, i) => (
                <div key={m.id} className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 text-sm font-medium flex items-center justify-between">
                    <span>
                      {i + 1}. {m.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {m.lessons.length} lessons
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {m.lessons.map((l) => {
                      const canOpen = enrolled || l.isPreview;
                      return (
                        <li
                          key={l.id}
                          className="flex flex-col gap-1 px-4 py-3 text-sm"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                              {l.videoUrl ? "🎬" : "📄"} {l.title}
                              {l.isPreview && (
                                <span className="rounded-full bg-skillGreen/20 px-2 py-0.5 text-[10px] text-skillGreen font-semibold">
                                  Free preview
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-3 text-xs text-gray-400">
                              {l.duration > 0 && <span>{l.duration}m</span>}
                              {canOpen ? (
                                <Link
                                  href={`/learn/${course.id}`}
                                  className="font-medium text-skillBlue hover:underline"
                                >
                                  Open
                                </Link>
                              ) : (
                                <span>🔒</span>
                              )}
                            </span>
                          </div>
                          {l.content && (
                            <p className="pl-6 text-xs text-gray-400 italic whitespace-pre-line">
                              {l.content}
                            </p>
                          )}
                        </li>
                      );
                    })}
                    {m.lessons.length === 0 && (
                      <li className="px-4 py-2 text-xs text-gray-400">
                        No lessons yet.
                      </li>
                    )}
                  </ul>
                </div>
              ))}
              {course.modules.length === 0 && (
                <p className="text-sm text-gray-400">
                  Curriculum is being prepared.
                </p>
              )}
            </div>
          </section>

          {/* ═══════════════ 7. INSTRUCTOR DETAILS ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Instructor
            </h2>
            <div className="flex items-center gap-4">
              <Image
                src={course.instructor.img || "/noAvatar.png"}
                alt={course.instructor.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-skillBlue/20"
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {course.instructor.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {course.instructor._count.courses} course
                  {course.instructor._count.courses === 1 ? "" : "s"} on
                  SkillNest
                </p>
                {course.instructor.email && (
                  <p className="text-xs text-skillBlue mt-1">
                    {course.instructor.email}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ═══════════════ 8. PREVIEW VIDEO ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Preview Video
            </h2>
            <div className="overflow-hidden rounded-lg bg-black">
              {embed ? (
                <iframe
                  src={embed}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : course.trailerUrl ? (
                <video
                  src={course.trailerUrl}
                  controls
                  className="aspect-video w-full"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-skillBlue/10 to-skillPurple/10 text-sm text-gray-400">
                  No preview video available yet.
                </div>
              )}
            </div>
          </section>

          {/* ═══════════════ 9. REVIEWS & RATINGS ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Reviews & Ratings
              </h2>
              <div className="flex items-center gap-2">
                <Stars value={ratingAvg} />
                <span className="text-sm text-gray-500">
                  {ratingAvg.toFixed(1)} · {course.reviews.length} review
                  {course.reviews.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Rating breakdown */}
            {course.reviews.length > 0 && (
              <div className="mb-5 flex gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-skillBlue">
                    {ratingAvg.toFixed(1)}
                  </p>
                  <Stars value={ratingAvg} />
                  <p className="text-xs text-gray-400 mt-1">
                    {course.reviews.length} ratings
                  </p>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = course.reviews.filter(
                      (r) => r.rating === star
                    ).length;
                    const pct = (count / course.reviews.length) * 100;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-gray-500">{star}</span>
                        <span className="text-skillYellow">★</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-skillYellow rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-400">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {enrolled && (
              <div className="mb-4">
                <ReviewForm courseId={course.id} existing={myReview} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {course.reviews.length === 0 && (
                <p className="text-sm text-gray-400">No reviews yet.</p>
              )}
              {course.reviews.map((r) => (
                <div key={r.id} className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {r.student.name}
                    </span>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-300">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════ 10. CERTIFICATE ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Certificate
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-skillGreen/10 text-3xl">
                🏆
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  Certificate of Completion
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Complete all lessons to earn your certificate. Share it on
                  LinkedIn or download as PDF.
                </p>
                {enrolled && hasCertificate && (
                  <Link
                    href="/certificates"
                    className="mt-2 inline-block text-sm font-medium text-skillGreen hover:underline"
                  >
                    View your certificate →
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* ═══════════════ 12. FAQ ═══════════════ */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h2>
            <FaqAccordion faqs={course.faqs} />
          </section>

          {/* ═══════════════ 13. RELATED COURSES ═══════════════ */}
          {relatedCourses.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Related Courses
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedCourses.map((rc) => (
                  <Link
                    key={rc.id}
                    href={`/course/${rc.id}`}
                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 transition hover:shadow-md group"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-skillBlue/20 to-skillPurple/20">
                      {rc.img && (
                        <Image
                          src={rc.img}
                          alt={rc.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <span className="text-[10px] uppercase tracking-wide text-skillPurple">
                        {rc.category} · {rc.level}
                      </span>
                      <h3 className="mt-1 font-semibold leading-snug text-sm">
                        {rc.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {rc.instructor.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>👥 {rc._count.enrollments}</span>
                        <span className="font-semibold text-skillBlue">
                          {rc.price > 0 ? `₹${rc.price}` : "Free"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ═══════════ RIGHT SIDEBAR — PRICING CARD ═══════════ */}
        <aside className="w-full shrink-0 lg:w-80">
          <div className="rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-4">
            {/* ═══════════════ 11. PRICING ═══════════════ */}
            <div className="overflow-hidden rounded-lg bg-black mb-4">
              {embed ? (
                <iframe
                  src={embed}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : course.img ? (
                <div className="relative aspect-video w-full">
                  <Image src={course.img} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-skillBlue/30 to-skillPurple/30 text-sm text-white/70">
                  Course preview
                </div>
              )}
            </div>

            <div className="text-3xl font-bold text-skillBlue mb-1">
              {course.price > 0 ? `₹${course.price}` : "Free"}
            </div>
            <p className="text-xs text-gray-400 mb-4">Lifetime access</p>

            <div className="flex flex-col gap-2 mb-5">
              {enrolled ? (
                <>
                  <Link
                    href={`/learn/${course.id}`}
                    className="w-full rounded-lg bg-[#0a7a52] dark:bg-[#C5F82A] text-white dark:text-black px-4 py-3 text-center text-sm font-semibold shadow-md hover:brightness-110 transition"
                  >
                    Continue Learning →
                  </Link>
                  <Link
                    href={`/messages`}
                    className="w-full rounded-lg border border-skillBlue px-4 py-3 text-center text-sm font-medium text-skillBlue hover:bg-skillBlue/5 transition"
                  >
                    💬 Talk to Teacher
                  </Link>
                </>
              ) : session?.role === "student" ? (
                <EnrollButton courseId={course.id} price={course.price} />
              ) : (
                <Link
                  href={`/learn/${course.id}`}
                  className="w-full rounded-lg border border-skillBlue px-4 py-3 text-center text-sm font-medium text-skillBlue hover:bg-skillBlue/5 transition"
                >
                  Preview Course
                </Link>
              )}

              {session?.role === "student" && !enrolled && (
                <WishlistButton
                  courseId={course.id}
                  initial={wishlisted}
                  variant="full"
                />
              )}
            </div>

            <h3 className="text-sm font-semibold mb-3">This course includes:</h3>
            <ul className="flex flex-col gap-2 text-xs text-gray-500">
              <li className="flex items-center gap-2">
                📦 {course.modules.length} modules
              </li>
              <li className="flex items-center gap-2">
                🎬 {totalLessons} lessons
              </li>
              <li className="flex items-center gap-2">
                ⏱ {durationStr} of content
              </li>
              <li className="flex items-center gap-2">
                📊 {course.level} level
              </li>
              <li className="flex items-center gap-2">♾ Lifetime access</li>
              <li className="flex items-center gap-2">
                🏆 Certificate of completion
              </li>
              <li className="flex items-center gap-2">
                💬 Discussion forum access
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetailPage;
