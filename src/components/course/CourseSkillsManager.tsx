"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";

import { setCourseSkills } from "@/lib/courseActions";

/**
 * Tag a course with canonical JobNest skill slugs. These drive HubNest
 * skill-gap recommendations and what a completed course verifies onto the
 * learner's JobNest candidate profile.
 *
 * Slugs should match peeldb.Skill.slug (e.g. "react", "node-js", "typescript").
 */
const slugify = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CourseSkillsManager = ({
  courseId,
  initialSkills,
}: {
  courseId: number;
  initialSkills: string[];
}) => {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const addSkill = (raw: string) => {
    const slug = slugify(raw);
    if (!slug) return;
    if (skills.includes(slug)) {
      setDraft("");
      return;
    }
    setSkills((prev) => [...prev, slug]);
    setDraft("");
  };

  const removeSkill = (slug: string) =>
    setSkills((prev) => prev.filter((s) => s !== slug));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === "Backspace" && !draft && skills.length) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  const save = () => {
    startTransition(async () => {
      const res = await setCourseSkills(courseId, skills);
      if (res.success) toast.success("Job skills saved");
      else toast.error(res.message || "Could not save skills");
    });
  };

  return (
    <div className="mt-8 rounded-md border border-gray-100 p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Job Skills</h2>
        <button
          onClick={save}
          disabled={pending}
          className="rounded-md bg-skillPurple px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Skills"}
        </button>
      </div>
      <p className="mb-3 text-xs text-gray-400">
        Map this course to JobNest skills (e.g. <code>react</code>, <code>node-js</code>).
        Learners who complete it get these skills verified on their JobNest
        profile, and the course is recommended to candidates missing them.
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2">
        {skills.map((slug) => (
          <span
            key={slug}
            className="flex items-center gap-1 rounded bg-skillPurple/10 px-2 py-1 text-xs text-skillPurple"
          >
            {slug}
            <button
              type="button"
              onClick={() => removeSkill(slug)}
              className="text-skillPurple/60 hover:text-skillPurple"
              aria-label={`Remove ${slug}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && addSkill(draft)}
          placeholder={skills.length ? "Add another…" : "Type a skill and press Enter"}
          className="min-w-[140px] flex-1 border-none p-1 text-sm outline-none"
        />
      </div>
    </div>
  );
};

export default CourseSkillsManager;
