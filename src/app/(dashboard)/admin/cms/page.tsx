import Link from "next/link";
import CmsEditor from "@/components/cms/CmsEditor";
import { cmsPageMeta, getAllCmsPages } from "@/lib/cms";

const AdminCmsPage = async () => {
  const pages = await getAllCmsPages();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="rounded-3xl bg-skillBlue dark:bg-gradient-to-r dark:from-[#111827] dark:via-[#030712] dark:to-[#111827] border border-transparent dark:border-white/15 shadow-lg dark:shadow-2xl px-6 py-6 text-white backdrop-blur-xl relative overflow-hidden">
        <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between relative z-10">
          <div>
            <span className="inline-block rounded-full bg-white/20 text-white border border-white/30 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em]">
              Super Admin CMS
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Control SkillNest from one place</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/80 dark:text-gray-400 leading-relaxed">
              Manage the landing page, admin messaging, learner dashboard copy, and future
              content blocks without touching the code every time.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex rounded-xl border border-white/20 bg-white/10 dark:bg-white/10 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Back to Admin Dashboard →
          </Link>
        </div>
      </div>

      <CmsEditor initialPages={pages} meta={cmsPageMeta} />
    </div>
  );
};

export default AdminCmsPage;
