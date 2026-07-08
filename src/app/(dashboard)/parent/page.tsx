import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { getSession } from "@/lib/auth";
import { getCmsPage } from "@/lib/cms";
import prisma from "@/lib/prisma";

const ParentPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const currentUserId = session?.userId;
  const cms = await getCmsPage("parentDashboard");

  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId!,
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
      <div className="flex-1">
        <div className="rounded-3xl bg-skillDark px-6 py-5 text-white">
          <h1 className="text-xl font-semibold">{cms.welcomeTitle}</h1>
          <p className="mt-1 text-sm text-white/70">{cms.welcomeSubtitle}</p>
        </div>

        <div className="mt-4 space-y-4">
          {students.map((student) => (
            <div className="w-full xl:w-2/3" key={student.id}>
              <div className="h-full rounded-md bg-white p-4">
                <h1 className="text-xl font-semibold">
                  Schedule ({student.name})
                </h1>
                <BigCalendarContainer type="classId" id={student.classId} date={searchParams.date} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full xl:w-1/3">
        <div className="flex flex-col gap-8">
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default ParentPage;
