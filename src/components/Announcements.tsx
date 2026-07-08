import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function parseNoticeLink(description: string): { text: string; href: string | null } {
  const marker = "###link:";
  const idx = description.indexOf(marker);
  if (idx === -1) return { text: description, href: null };
  const rest = description.slice(idx + marker.length);
  const spaceIdx = rest.indexOf(" ");
  const href = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
  const text = description.slice(0, idx);
  return { text, href };
}

function NoticeCard({
  title,
  description,
  date,
  bgClass,
}: {
  title: string;
  description: string;
  date: Date;
  bgClass: string;
}) {
  const { text, href } = parseNoticeLink(description);
  const content = (
    <div className={`${bgClass} notice-card rounded-lg p-4 transition hover:shadow-md ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-gray-800 dark:text-gray-100 text-sm">{title}</h2>
        <span className="text-xs text-gray-400 bg-white rounded-md px-2 py-1 shadow-xs shrink-0 ml-2">
          {new Intl.DateTimeFormat("en-GB").format(date)}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{text}</p>
      {href && (
        <span className="mt-2 inline-block text-xs font-semibold text-skillBlue hover:underline">
          Review & Approve →
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

const Announcements = async () => {
  const session = await getSession();
  const userId = session?.userId || "";
  const role = session?.role || "";

  let data: any[] = [];
  try {
    const systemNoticesFilter = [
      { title: { contains: "course awaiting review", mode: "insensitive" as const } },
      { title: { contains: "Withdrawal request", mode: "insensitive" as const } },
      { title: { contains: "Payout request", mode: "insensitive" as const } },
      { title: { contains: "teacher registered", mode: "insensitive" as const } },
      { title: { contains: "registration", mode: "insensitive" as const } },
      { title: { contains: "onboarding completed", mode: "insensitive" as const } },
      { authorRole: "system" },
    ];

    if (role === "admin") {
      data = await prisma.announcement.findMany({
        take: 5,
        orderBy: { date: "desc" },
        where: {
          OR: systemNoticesFilter,
        },
      });

      if (data.length === 0) {
        data = await prisma.announcement.findMany({
          take: 3,
          orderBy: { date: "desc" },
        });
      }
    } else {
      const whereCondition: any = {
        NOT: systemNoticesFilter,
      };

      if (role === "teacher" && userId) {
        whereCondition.OR = [
          { authorId: userId },
          { classId: null, authorId: null },
        ];
      } else if (role === "student" && userId) {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: userId },
          select: { course: { select: { instructorId: true } } },
        });
        const tIds = Array.from(new Set(enrollments.map((e) => e.course.instructorId)));
        whereCondition.OR = [
          { classId: null, authorId: null },
          { title: { contains: "Live:", mode: "insensitive" as const } },
          ...(tIds.length > 0 ? [{ authorId: { in: tIds }, authorRole: "teacher" }] : []),
        ];
      } else if (role === "parent" && userId) {
        const children = await prisma.student.findMany({
          where: { parentId: userId },
          select: { id: true },
        });
        const cIds = children.map((c) => c.id);
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: { in: cIds } },
          select: { course: { select: { instructorId: true } } },
        });
        const tIds = Array.from(new Set(enrollments.map((e) => e.course.instructorId)));
        whereCondition.OR = [
          { classId: null, authorId: null },
          { title: { contains: "Live:", mode: "insensitive" as const } },
          ...(tIds.length > 0 ? [{ authorId: { in: tIds }, authorRole: "teacher" }] : []),
        ];
      }

      data = await prisma.announcement.findMany({
        take: 3,
        orderBy: { date: "desc" },
        where: whereCondition,
      });
    }
  } catch (error) {
    console.error("Database unavailable (Notices):", error);
    data = [];
  }

  const bgClasses = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Notices</h1>
        {role === "admin" && (
          <Link href="/admin/approvals" className="text-xs text-skillBlue font-medium hover:underline">Review All →</Link>
        )}
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data.length === 0 && (
          <p className="text-xs text-gray-400">No recent notices or pending actions.</p>
        )}
        {data.map((item: any, i: number) => (
          i < 3 && (
            <NoticeCard
              key={item.id}
              title={item.title}
              description={item.description}
              date={item.date}
              bgClass={bgClasses[i % bgClasses.length]}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default Announcements;
