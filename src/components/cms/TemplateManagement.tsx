"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

export type TemplateItem = {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  backgroundColor: string;
  category: string;
  isDark: boolean;
  isActive?: boolean;
};

const initialTemplates: TemplateItem[] = [
  {
    id: "tpl-1",
    name: "Pitch Black OLED Pro",
    description: "Ultra-sleek pure pitch black canvas (#000000) paired with signature SkillNest Green (#C5F82A) accents.",
    primaryColor: "#C5F82A",
    backgroundColor: "#000000",
    category: "Dark Theme",
    isDark: true,
    isActive: true,
  },
  {
    id: "tpl-2",
    name: "SkillNest Classic Light",
    description: "Vibrant, clean corporate learning layout with fresh mint green highlights and soft background contrasts.",
    primaryColor: "#2EE6A6",
    backgroundColor: "#F4F6F5",
    category: "Light Theme",
    isDark: false,
    isActive: false,
  },
  {
    id: "tpl-3",
    name: "Cyber Neon Cyan",
    description: "Futuristic deep navy environment with electric cyan accents, perfect for coding and developer labs.",
    primaryColor: "#38BDF8",
    backgroundColor: "#0F172A",
    category: "Developer Labs",
    isDark: true,
    isActive: false,
  },
  {
    id: "tpl-4",
    name: "Sunset Ember Studio",
    description: "Warm charcoal aesthetic with vibrant sunset orange badges, designed for creative workshops and media.",
    primaryColor: "#F97316",
    backgroundColor: "#1C1917",
    category: "Creative",
    isDark: true,
    isActive: false,
  },
];

const TemplateManagement = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    primaryColor: "#C5F82A",
    backgroundColor: "#000000",
    category: "General",
    isDark: true,
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      primaryColor: "#C5F82A",
      backgroundColor: "#000000",
      category: "Custom Theme",
      isDark: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (tpl: TemplateItem) => {
    setEditingId(tpl.id);
    setFormData({
      name: tpl.name,
      description: tpl.description,
      primaryColor: tpl.primaryColor,
      backgroundColor: tpl.backgroundColor,
      category: tpl.category,
      isDark: tpl.isDark,
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (editingId) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                name: formData.name,
                description: formData.description,
                primaryColor: formData.primaryColor,
                backgroundColor: formData.backgroundColor,
                category: formData.category,
                isDark: formData.isDark,
              }
            : t
        )
      );
      toast.success("Template updated successfully!");
    } else {
      const newTpl: TemplateItem = {
        id: `tpl-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        primaryColor: formData.primaryColor,
        backgroundColor: formData.backgroundColor,
        category: formData.category,
        isDark: formData.isDark,
        isActive: false,
      };
      setTemplates((prev) => [...prev, newTpl]);
      toast.success("New template created!");
    }
    setShowModal(false);
  };

  const handleActivate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isActive: t.id === id,
      }))
    );
    toast.info("Active theme template updated!");
  };

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.warn("Template removed");
  };

  return (
    <section className="mt-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C5F82A] animate-pulse" />
            <h2 className="text-xl font-bold text-skillDark dark:text-white">Website UI Templates Gallery</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customize and manage design themes, color systems, and visual presentation templates for SkillNest.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <span>+ Create New Template</span>
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ${
              tpl.isActive
                ? "border-[#C5F82A] bg-gray-50 dark:bg-[#121214] ring-2 ring-[#C5F82A]/30 shadow-xl"
                : "border-gray-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214]/60 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md"
            }`}
          >
            <div>
              {/* Color Preview Banner */}
              <div
                className="h-24 w-full rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-white/10 shadow-inner"
                style={{ backgroundColor: tpl.backgroundColor }}
              >
                <div className="flex items-center justify-between z-10">
                  <span
                    className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-black shadow-sm"
                    style={{ backgroundColor: tpl.primaryColor }}
                  >
                    {tpl.category}
                  </span>
                  {tpl.isActive && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#C5F82A] text-black rounded-md flex items-center gap-1">
                      ✓ Active
                    </span>
                  )}
                </div>
                <div className="z-10 flex items-center gap-2">
                  <span className="text-xs font-bold text-white drop-shadow-md">{tpl.name}</span>
                </div>
                {/* Decorative glow */}
                <div
                  className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full blur-xl opacity-40"
                  style={{ backgroundColor: tpl.primaryColor }}
                />
              </div>

              {/* Details */}
              <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>{tpl.name}</span>
              </h3>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>

              {/* Color Codes */}
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 dark:border-zinc-800/60 pt-3 text-[11px] text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-gray-300 dark:border-zinc-600" style={{ backgroundColor: tpl.primaryColor }} />
                  <span>Primary: <strong className="text-gray-700 dark:text-gray-300">{tpl.primaryColor}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-gray-300 dark:border-zinc-600" style={{ backgroundColor: tpl.backgroundColor }} />
                  <span>BG: <strong className="text-gray-700 dark:text-gray-300">{tpl.backgroundColor}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-800/80 pt-3">
              <button
                onClick={() => handleActivate(tpl.id)}
                disabled={tpl.isActive}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tpl.isActive
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-default"
                    : "bg-[#C5F82A] text-black hover:brightness-105 active:scale-95 shadow-sm"
                }`}
              >
                {tpl.isActive ? "Applied" : "Apply Template"}
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(tpl)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition"
                  title="Edit Template"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition"
                  title="Delete Template"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0D0D0E] border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? "Edit UI Template" : "Create New UI Template"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emerald Pro Dark"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue focus:ring-1 focus:ring-skillBlue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dark Mode, Gaming, Corporate"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue focus:ring-1 focus:ring-skillBlue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Background Canvas Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description & Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the aesthetic rationale, contrast targets, or target audience..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-skillBlue focus:ring-1 focus:ring-skillBlue"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-5 py-2 text-xs font-semibold text-white transition shadow-md"
                >
                  {editingId ? "Save Changes" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default TemplateManagement;
