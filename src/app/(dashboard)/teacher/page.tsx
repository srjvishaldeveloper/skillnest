import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import TeacherOnboardingWrapper from "@/components/TeacherOnboardingWrapper";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCmsPage } from "@/lib/cms";

const TeacherPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const userId = session?.userId;
  let teacher = null;

  if (userId) {
    try {
      teacher = await prisma.teacher.findUnique({
        where: { id: userId },
      });
    } catch (error) {
      console.error("Database unavailable (teacher lookup):", error);
      teacher = null;
    }
  }

  const cms = await getCmsPage("teacherDashboard");

  return (
    <>
      <TeacherOnboardingWrapper
        onboardingComplete={teacher?.onboardingComplete ?? false}
        teacherName={teacher?.name ?? "Instructor"}
      />
      {teacher && !teacher.isVerified && (
        <div className="mx-4 mt-4 rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-3 text-sm text-yellow-800">
          <strong>Verification pending.</strong> Your profile is not verified yet. Please wait for a
          confirmation email from the admin. You cannot create courses until your profile is
          verified.
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
        <div className="flex w-full flex-col gap-4 xl:w-2/3">
          <div className="rounded-3xl bg-skillDark px-6 py-5 text-white">
            <h1 className="text-xl font-semibold">{cms.welcomeTitle}</h1>
            <p className="mt-1 text-sm text-white/70">{cms.welcomeSubtitle}</p>
          </div>
          <div className="h-full rounded-md bg-white p-4">
            <h1 className="text-xl font-semibold">{cms.scheduleTitle}</h1>
            <BigCalendarContainer type="teacherId" id={userId || ""} date={searchParams.date} />
          </div>
        </div>
        <div className="flex w-full flex-col gap-8 xl:w-1/3">
          <Announcements />
        </div>
      </div>
    </>
  );
};

export default TeacherPage;