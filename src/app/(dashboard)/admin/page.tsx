import Link from "next/link";
import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import { getCmsPage } from "@/lib/cms";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const cms = await getCmsPage("adminDashboard");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-3xl bg-skillBlue dark:bg-gradient-to-r dark:from-[#111827] dark:via-[#030712] dark:to-[#111827] border border-transparent dark:border-white/15 shadow-lg dark:shadow-2xl px-6 py-6 text-white backdrop-blur-xl relative overflow-hidden">
        <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between relative z-10">
          <div>
            <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white border border-white/30 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 rounded-full mb-2">
              Super Admin Console
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">{cms.welcomeTitle}</h1>
            <p className="mt-1.5 max-w-3xl text-sm text-white/80 dark:text-gray-400 leading-relaxed">{cms.welcomeSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {cms.heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-4 py-3 min-w-[130px] shadow-inner"
              >
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/70 dark:text-sky-400">
                  {item.label}
                </div>
                <div className="mt-1 text-base font-extrabold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-white dark:bg-[#0D0D0E] border border-gray-200 dark:border-zinc-800/80 p-6 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{cms.cmsCard.title}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{cms.cmsCard.description}</p>
          </div>
          <Link
            href={cms.cmsCard.buttonHref}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-skillBlue hover:bg-skillBlue/90 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 w-fit"
          >
            {cms.cmsCard.buttonLabel} →
          </Link>
        </div>
        <div className="rounded-3xl bg-white dark:bg-[#0D0D0E] border border-gray-200 dark:border-zinc-800/80 p-6 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{cms.operationsCard.title}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{cms.operationsCard.description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex w-full flex-col gap-8 lg:w-2/3">
          <div className="flex flex-wrap justify-between gap-4">
            <UserCard type="admin" />
            <UserCard type="teacher" />
            <UserCard type="student" />
            <UserCard type="parent" />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="h-[450px] w-full lg:w-1/3">
              <CountChartContainer />
            </div>
            <div className="h-[450px] w-full lg:w-2/3">
              <AttendanceChartContainer />
            </div>
          </div>
          <div className="h-[500px] w-full">
            <FinanceChart />
          </div>
        </div>

        <div className="flex w-full flex-col gap-8 lg:w-1/3">
          <EventCalendarContainer searchParams={searchParams} />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
