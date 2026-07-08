"use client";

import { useState } from "react";
import { toast } from "react-toastify";

export type EmailTemplateItem = {
  id: string;
  key: string;
  name: string;
  subject: string;
  headerTitle: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
  category: "Transactional" | "Marketing" | "System" | "Custom";
};

const initialEmailTemplates: EmailTemplateItem[] = [
  {
    id: "et-1",
    key: "welcome",
    name: "Welcome Onboarding Email",
    subject: "Welcome to SkillNest, {{name}}! 🎉",
    headerTitle: "Welcome aboard, {{name}}!",
    bodyHtml: "<p>Your SkillNest account is ready. Your username is <b>{{username}}</b>.</p><p>Browse courses, learn new skills, and earn industry-recognized certificates.</p>",
    ctaText: "Sign in to SkillNest",
    ctaUrl: "/signin",
    category: "Transactional",
  },
  {
    id: "et-2",
    key: "enrolled",
    name: "Course Enrollment Confirmation",
    subject: "You're enrolled — {{courseTitle}}",
    headerTitle: "Enrollment confirmed 🎓",
    bodyHtml: "<p>Hi {{name}}, you are officially enrolled in <b>{{courseTitle}}</b>.</p><p>Start exploring modules and assignments right away.</p>",
    ctaText: "Start Learning",
    ctaUrl: "/learn/{{courseId}}",
    category: "Transactional",
  },
  {
    id: "et-3",
    key: "paymentSuccess",
    name: "Payment Receipt Confirmation",
    subject: "Payment successful — {{courseTitle}}",
    headerTitle: "Payment received ✅",
    bodyHtml: "<p>Hi {{name}}, we received your payment of <b>₹{{amount}}</b> for <b>{{courseTitle}}</b>.</p><p>Order <b>#{{orderId}}</b> is complete. Happy learning!</p>",
    ctaText: "Go to Course",
    ctaUrl: "/learn/{{courseId}}",
    category: "Transactional",
  },
  {
    id: "et-4",
    key: "certificate",
    name: "Certificate Completion Award",
    subject: "🎓 Certificate earned — {{courseTitle}}",
    headerTitle: "Congratulations, {{name}}!",
    bodyHtml: "<p>You have successfully completed <b>{{courseTitle}}</b> and earned a verified SkillNest certificate.</p>",
    ctaText: "View / Download Certificate",
    ctaUrl: "/certificate/{{code}}",
    category: "Transactional",
  },
  {
    id: "et-5",
    key: "courseApproved",
    name: "Instructor Course Approved",
    subject: "✅ Your course is live — {{courseTitle}}",
    headerTitle: "Approved & published 🎉",
    bodyHtml: "<p>Hi {{name}}, <b>{{courseTitle}}</b> has been reviewed, approved, and is now live on SkillNest.</p>",
    ctaText: "View Live Course",
    ctaUrl: "/course/{{courseId}}",
    category: "System",
  },
  {
    id: "et-6",
    key: "teacherVerified",
    name: "Instructor Profile Verified",
    subject: "✅ Your instructor profile is verified on SkillNest",
    headerTitle: "Profile verified!",
    bodyHtml: "<p>Hi {{name}}, your instructor profile has been officially verified by our administration team.</p><p>You can now create courses and share your expertise.</p>",
    ctaText: "Start Creating Courses",
    ctaUrl: "/courses",
    category: "System",
  },
];

const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplateItem[]>(initialEmailTemplates);
  const [selectedId, setSelectedId] = useState<string>(initialEmailTemplates[0].id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const activeTemplate = templates.find((t) => t.id === selectedId) || templates[0];

  // Edit State
  const [editForm, setEditForm] = useState<EmailTemplateItem>(activeTemplate);

  const handleSelect = (tpl: EmailTemplateItem) => {
    setSelectedId(tpl.id);
    setEditForm(tpl);
    setPreviewMode(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setTemplates((prev) => prev.map((t) => (t.id === editForm.id ? editForm : t)));
    toast.success(`Email template "${editForm.name}" updated successfully!`);
  };

  // Create Modal Form State
  const [newForm, setNewForm] = useState({
    name: "",
    subject: "",
    headerTitle: "",
    bodyHtml: "",
    ctaText: "",
    ctaUrl: "",
    category: "Custom" as const,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.subject.trim()) {
      toast.error("Please enter template name and email subject.");
      return;
    }

    const newTpl: EmailTemplateItem = {
      id: `et-${Date.now()}`,
      key: newForm.name.toLowerCase().replace(/\s+/g, "_"),
      name: newForm.name,
      subject: newForm.subject,
      headerTitle: newForm.headerTitle || newForm.name,
      bodyHtml: newForm.bodyHtml || "<p>Your email body content goes here.</p>",
      ctaText: newForm.ctaText || "Click Here",
      ctaUrl: newForm.ctaUrl || "/",
      category: newForm.category,
    };

    setTemplates((prev) => [...prev, newTpl]);
    setSelectedId(newTpl.id);
    setEditForm(newTpl);
    setShowCreateModal(false);
    toast.success("New custom email template created!");
  };

  const handleDelete = (id: string) => {
    if (templates.length <= 1) {
      toast.error("At least one email template must remain.");
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    const remaining = templates.filter((t) => t.id !== id);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
      setEditForm(remaining[0]);
    }
    toast.warn("Email template removed");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✉️</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Notification Templates</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Edit automated outgoing system email templates or create new custom notification formats.
          </p>
        </div>
        <button
          onClick={() => {
            setNewForm({
              name: "",
              subject: "",
              headerTitle: "",
              bodyHtml: "",
              ctaText: "",
              ctaUrl: "",
              category: "Custom",
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-4 py-2.5 text-sm font-semibold text-white transition shadow-md active:scale-95 w-fit"
        >
          <span>+ Create New Email Template</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sidebar List of Templates */}
        <aside className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-4 flex flex-col gap-2">
          <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Active Email Templates ({templates.length})
          </div>
          <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-1">
            {templates.map((tpl) => {
              const isActive = tpl.id === selectedId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  className={`group relative text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                    isActive
                      ? "border-skillBlue bg-skillBlue/10 dark:bg-skillBlue/20 dark:border-skillBlue"
                      : "border-gray-100 dark:border-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700 bg-gray-50/50 dark:bg-[#121214]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {tpl.name}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 shrink-0">
                      {tpl.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Subject: {tpl.subject}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Editor Panel */}
        <main className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-6 flex flex-col gap-6">
          {/* Top Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-skillBlue">
                {editForm.category} Template
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{editForm.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  previewMode
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                {previewMode ? "✏️ Back to Edit Mode" : "👁️ Live HTML Preview"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(editForm.id)}
                className="rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-2 text-xs font-semibold transition"
                title="Delete Template"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {previewMode ? (
            /* Live Email Preview Box */
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-black p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-[560px] bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xl font-sans text-gray-800">
                <div className="bg-[#2563EB] p-4 text-white text-lg font-bold">
                  SkillNest
                </div>
                <div className="p-6 flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-gray-900 m-0">{editForm.headerTitle}</h2>
                  <div
                    className="text-sm leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: editForm.bodyHtml }}
                  />
                  {editForm.ctaText && (
                    <div>
                      <span className="inline-block mt-3 bg-[#2563EB] text-white font-bold px-4 py-2 rounded-lg text-sm shadow">
                        {editForm.ctaText}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 text-xs text-gray-400 bg-gray-50">
                  SkillNest — Learn. Grow. Get Hired. · http://localhost:3000
                </div>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Template Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value as EmailTemplateItem["category"],
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#121214] px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                  >
                    <option value="Transactional">Transactional</option>
                    <option value="System">System</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Header Title
                </label>
                <input
                  type="text"
                  required
                  value={editForm.headerTitle}
                  onChange={(e) => setEditForm({ ...editForm, headerTitle: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Body HTML Content (Supports formatting and variables like {"{{name}}"}, {"{{courseTitle}}"})
                </label>
                <textarea
                  rows={6}
                  required
                  value={editForm.bodyHtml}
                  onChange={(e) => setEditForm({ ...editForm, bodyHtml: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-[#0f172a] p-3.5 text-sm font-mono text-slate-100 outline-none focus:border-skillBlue"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={editForm.ctaText}
                    onChange={(e) => setEditForm({ ...editForm, ctaText: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Target Link URL
                  </label>
                  <input
                    type="text"
                    value={editForm.ctaUrl}
                    onChange={(e) => setEditForm({ ...editForm, ctaUrl: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue font-mono text-xs"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-4">
                <button
                  type="submit"
                  className="rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-6 py-2.5 text-sm font-semibold text-white transition shadow-md active:scale-95"
                >
                  Save Email Template
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0D0D0E] border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Custom Email Template</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Template Title / Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Learning Summary"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Here is your weekly learning recap!"
                  value={newForm.subject}
                  onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Header Title inside Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Recap 📈"
                  value={newForm.headerTitle}
                  onChange={(e) => setNewForm({ ...newForm, headerTitle: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Body HTML Content
                </label>
                <textarea
                  rows={4}
                  placeholder="<p>Write your custom email announcement or content here...</p>"
                  value={newForm.bodyHtml}
                  onChange={(e) => setNewForm({ ...newForm, bodyHtml: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-[#0f172a] p-3 text-sm font-mono text-slate-100 outline-none focus:border-skillBlue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Check Progress"
                    value={newForm.ctaText}
                    onChange={(e) => setNewForm({ ...newForm, ctaText: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Target Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /my-learning"
                    value={newForm.ctaUrl}
                    onChange={(e) => setNewForm({ ...newForm, ctaUrl: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:border-skillBlue"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-5 py-2 text-xs font-semibold text-white transition shadow-md"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateManager;
