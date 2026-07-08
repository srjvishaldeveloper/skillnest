import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
  date,
}: {
  type: "teacherId" | "classId";
  id: string | number;
  date?: string;
}) => {
  let dataRes: any[] = [];
  try {
    dataRes = await prisma.lesson.findMany({
      where: {
        ...(type === "teacherId"
          ? { teacherId: id as string }
          : { classId: id as number }),
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        class: { select: { name: true } },
      },
    });
  } catch (error) {
    console.error("Database unavailable (BigCalendarContainer):", error);
    dataRes = [];
  }

  const data = dataRes.map((lesson) => ({
    title: lesson.name,
    start: lesson.startTime,
    end: lesson.endTime,
    subject: lesson.subject.name,
    teacher: lesson.teacher.name,
    class: lesson.class.name,
  }));

  const schedule = adjustScheduleToCurrentWeek(data, date);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
