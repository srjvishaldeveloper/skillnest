"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { CmsContentMap, CmsPageKey } from "@/lib/cms";
import LandingCmsForm from "./LandingCmsForm";
import EmailTemplateManager from "./EmailTemplateManager";

type ExtendedTabKey = CmsPageKey | "emailTemplates";

type CmsEditorProps = {
  initialPages: CmsContentMap;
  meta: Record<CmsPageKey, { title: string; description: string; revalidatePaths: string[] }>;
};

const pageKeys = Object.keys({
  landing: true,
  adminDashboard: true,
  studentDashboard: true,
  teacherDashboard: true,
  parentDashboard: true,
  agreements: true,
}) as CmsPageKey[];

const CmsEditor = ({ initialPages, meta }: CmsEditorProps) => {
  const [activeTab, setActiveTab] = useState<ExtendedTabKey>("landing");
  const [drafts, setDrafts] = useState<Record<CmsPageKey, string>>(() => {
    return pageKeys.reduce((acc, key) => {
      acc[key] = JSON.stringify(initialPages[key], null, 2);
      return acc;
    }, {} as Record<CmsPageKey, string>);
  });
  const [savingKey, setSavingKey] = useState<CmsPageKey | null>(null);

  const savePage = async (key: CmsPageKey) => {
    try {
      setSavingKey(key);
      const content = JSON.parse(drafts[key]);

      const response = await fetch(`/api/cms/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save content");
      }

      setDrafts((current) => ({
        ...current,
        [key]: JSON.stringify(data.content, null, 2),
      }));
      toast.success(`${meta[key].title} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save CMS content");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-white dark:bg-[#0D0D0E] p-4 flex flex-col justify-between shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">CMS Pages</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Manage landing content, dashboard copy, and outgoing email templates.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {pageKeys.map((key) => {
              const isActive = key === activeTab;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-skillBlue bg-skillBlue/5 dark:bg-skillBlue/15 dark:border-skillBlue"
                      : "border-gray-200 dark:border-zinc-800/80 hover:border-skillBlue/40 dark:hover:border-zinc-700 bg-gray-50/50 dark:bg-[#121214]/60"
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{meta[key].title}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-snug">{meta[key].description}</div>
                </button>
              );
            })}

            {/* Email Templates Tab right under Parent Dashboard */}
            <button
              type="button"
              onClick={() => setActiveTab("emailTemplates")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                activeTab === "emailTemplates"
                  ? "border-skillBlue bg-skillBlue/5 dark:bg-skillBlue/15 dark:border-skillBlue"
                  : "border-gray-200 dark:border-zinc-800/80 hover:border-skillBlue/40 dark:hover:border-zinc-700 bg-gray-50/50 dark:bg-[#121214]/60"
              }`}
            >
              <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>✉️</span> Email Templates
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                Edit automated outgoing system email templates or create new ones.
              </div>
            </button>
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-white dark:bg-[#0D0D0E] p-6 shadow-sm">
        {activeTab === "emailTemplates" ? (
          <EmailTemplateManager />
        ) : activeTab === "landing" ? (
          <LandingCmsForm initialContent={initialPages.landing} />
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meta[activeTab].title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{meta[activeTab].description}</p>
                <p className="mt-2 text-xs font-mono text-gray-400 dark:text-zinc-500">
                  Revalidates: {meta[activeTab].revalidatePaths.join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => savePage(activeTab)}
                disabled={savingKey === activeTab}
                className="rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-5 py-2.5 text-sm font-semibold text-white transition shadow-md disabled:opacity-60 active:scale-95 w-fit"
              >
                {savingKey === activeTab ? "Saving..." : "Save Content"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[#0f172a] p-4 border border-zinc-800">
              <textarea
                value={drafts[activeTab]}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeTab]: event.target.value,
                  }))
                }
                spellCheck={false}
                className="min-h-[640px] w-full resize-y rounded-xl border border-white/10 bg-[#111827] p-4 font-mono text-sm text-slate-100 outline-none focus:border-skillBlue"
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CmsEditor;
