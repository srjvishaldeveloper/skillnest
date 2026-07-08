import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ClaimCertificateButton from "@/components/course/ClaimCertificateButton";

const CertificatesPage = async () => {
  const session = await getSession();

  if (session?.role !== "student") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Certificates</h1>
        <p className="mt-4 text-sm text-gray-400">
          Only learners earn certificates.{" "}
          <Link href="/browse" className="text-skillBlue hover:underline">
            Browse courses →
          </Link>
        </p>
      </div>
    );
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: session.userId },
    orderBy: { issuedAt: "desc" },
    include: { course: { select: { title: true } } },
  });

  // enrolled courses that are 100% complete but not yet claimed
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          modules: { include: { _count: { select: { lessons: true } } } },
        },
      },
    },
  });
  // count completed lessons per course
  const doneByCourse = new Map<number, number>();
  const allProgress = await prisma.lessonProgress.findMany({
    where: { studentId: session.userId },
    include: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  allProgress.forEach((p) => {
    const cId = p.lesson.module.courseId;
    doneByCourse.set(cId, (doneByCourse.get(cId) || 0) + 1);
  });

  const certifiedCourseIds = new Set(certificates.map((c) => c.courseId));
  const claimable = enrollments.filter(({ course }) => {
    const total = course.modules.reduce((s, m) => s + m._count.lessons, 0);
    const done = doneByCourse.get(course.id) || 0;
    return total > 0 && done >= total && !certifiedCourseIds.has(course.id);
  });

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      <h1 className="text-lg font-semibold">My Certificates</h1>

      {/* claimable */}
      {claimable.length > 0 && (
        <div className="mt-4 rounded-xl border border-skillGreen/30 bg-skillGreen/5 p-4">
          <p className="text-sm font-medium text-skillGreen">
            🎉 You&apos;ve completed these courses — claim your certificate!
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {claimable.map(({ course }) => (
              <li
                key={course.id}
                className="flex items-center justify-between rounded-md bg-white px-4 py-2 text-sm"
              >
                <span>{course.title}</span>
                <ClaimCertificateButton courseId={course.id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {certificates.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">
          No certificates yet. Complete a course to earn one.{" "}
          <Link href="/my-learning" className="text-skillBlue hover:underline">
            Go to My Learning →
          </Link>
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <div
              key={c.id}
              className="flex flex-col rounded-xl border-2 border-double border-skillBlue/40 bg-gradient-to-br from-skillBlue/5 to-skillPurple/5 p-5"
            >
              <span className="text-[10px] uppercase tracking-widest text-gray-400">
                Certificate of Completion
              </span>
              <h3 className="mt-2 font-semibold leading-snug">{c.course.title}</h3>
              <p className="mt-1 text-xs text-gray-500">
                Issued{" "}
                {new Intl.DateTimeFormat("en-GB").format(c.issuedAt)}
              </p>
              <p className="mt-1 font-mono text-[10px] text-gray-400">{c.code}</p>
              <Link
                href={`/certificate/${c.code}`}
                target="_blank"
                className="mt-4 rounded-md bg-skillBlue px-4 py-2 text-center text-sm font-semibold text-white"
              >
                View / Download
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
