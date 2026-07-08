import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const LiveRoomPage = async ({ params: { id } }: { params: { id: string } }) => {
  const session = await getSession();
  const liveId = parseInt(id);

  const live = await prisma.liveClass.findUnique({
    where: { id: liveId },
    include: { course: { select: { id: true, title: true, instructorId: true } } },
  });
  if (!live) return notFound();

  const isStudent = session?.role === "student";
  const isHost =
    session?.role === "admin" ||
    (session?.role === "teacher" && live.course.instructorId === session.userId);

  // enrollment gate + auto-attendance for learners
  let allowed = isHost;
  let displayName = "Guest";
  if (isStudent && session) {
    const enrolled = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: session.userId, courseId: live.courseId },
      },
    });
    allowed = !!enrolled;
    if (enrolled) {
      await prisma.liveAttendance.upsert({
        where: {
          liveClassId_studentId: { liveClassId: liveId, studentId: session.userId },
        },
        create: { liveClassId: liveId, studentId: session.userId },
        update: {},
      });
      const me = await prisma.student.findUnique({
        where: { id: session.userId },
        select: { name: true },
      });
      if (me) displayName = me.name;
    }
  } else if (isHost && session) {
    const me = await prisma.teacher.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });
      if (me) displayName = me.name;
  }

  if (!allowed) {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-8 text-center">
        <h1 className="text-xl font-bold">{live.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enroll in <b>{live.course.title}</b> to join this live class.
        </p>
        <Link
          href={`/course/${live.courseId}`}
          className="mt-4 inline-block rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
        >
          Go to course
        </Link>
      </div>
    );
  }

  const roomUrl = `${live.meetingUrl}#userInfo.displayName=${encodeURIComponent(
    `"${displayName}"`
  )}`;

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/learn/${live.courseId}`} className="text-gray-400 hover:underline">
          {live.course.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">🎥 {live.title}</span>
        {isStudent && (
          <span className="ml-2 rounded-full bg-skillGreen/20 px-2 py-0.5 text-[10px] text-skillGreen">
            ✓ Attendance marked
          </span>
        )}
      </div>

      <iframe
        src={roomUrl}
        title={live.title}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="h-[78vh] w-full rounded-xl border border-gray-200"
      />
    </div>
  );
};

export default LiveRoomPage;
