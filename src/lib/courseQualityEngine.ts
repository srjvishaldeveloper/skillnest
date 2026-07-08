/**
 * courseQualityEngine.ts
 *
 * Pure TypeScript auto-approval scoring engine — NO Prisma imports.
 * Receives pre-fetched plain objects and returns a 0–100 quality score
 * with a per-dimension breakdown for the admin approvals UI.
 *
 * Scoring breakdown (100 pts total):
 *   Title quality        15 pts  — length, banned words, casing
 *   Description quality  15 pts  — character count tiers
 *   Learning outcomes    10 pts  — count + minimum length per outcome
 *   Curriculum depth     20 pts  — modules, lessons, total duration, free preview
 *   Category match       20 pts  — 10 rule-based (skillSlugs ↔ dict) + 10 Claude AI
 *   Instructor record    20 pts  — avg rating of last 10 published courses
 *                                  (new teachers < 10 courses → neutral 15/20)
 *
 * Auto-approve threshold: total >= 80 AND teacher.isVerified
 */

import { callClaude, aiConfigured } from "@/lib/ai";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CourseInput {
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  courseSkills: string[]; // raw skill slug strings from CourseSkill table
  modules: Array<{
    lessons: Array<{
      title: string;
      duration: number;   // minutes
      isPreview: boolean;
      videoUrl: string | null;
      content: string;
    }>;
  }>;
}

export interface TeacherInput {
  isVerified: boolean;
  /** Last ≤ 10 published courses ordered by createdAt DESC */
  publishedCourses: Array<{
    category: string;
    reviews: Array<{ rating: number }>;
  }>;
}

export interface DimensionScore {
  score: number;
  max: number;
  reason: string;
}

export interface ScoreBreakdown {
  title: DimensionScore;
  description: DimensionScore;
  outcomes: DimensionScore;
  curriculum: DimensionScore;
  categoryMatch: DimensionScore;
  trackRecord: DimensionScore & { isNewTeacher: boolean };
}

export interface ScoreResult {
  total: number;       // 0–100
  autoApprove: boolean; // total >= 80
  claudeUsed: boolean;
  breakdown: ScoreBreakdown;
}

// ─────────────────────────────────────────────────────────────
// Category keyword dictionary
// Slugs come from courseSkills[] — teacher-tagged when building the course.
// Hardcoded list mirrors the platform's own skill taxonomy.
// ─────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  development: [
    "javascript","react","node","nodejs","typescript","nextjs","next.js","vue","angular",
    "flutter","swift","kotlin","python","java","c++","go","rust","graphql","docker",
    "api","backend","frontend","fullstack","full-stack","web","mobile","app",
    "programming","coding","software","database","mongodb","postgresql","mysql",
    "aws","cloud","devops","git","github","linux","bash","css","html","redux",
    "express","spring","django","fastapi","firebase","supabase","kubernetes","k8s",
  ],
  data: [
    "python","machine learning","deep learning","data analysis","sql","power bi",
    "tensorflow","pytorch","statistics","nlp","natural language processing",
    "computer vision","tableau","spark","pandas","numpy","data science","ai",
    "artificial intelligence","neural network","regression","classification",
    "clustering","data mining","big data","hadoop","kafka","etl","r","scikit",
    "langchain","llm","generative ai","openai","mlops","data engineering",
  ],
  business: [
    "entrepreneurship","product management","strategy","leadership","project management",
    "lean","okrs","business analysis","operations","supply chain","startup","management",
    "agile","scrum","pmp","consulting","negotiation","team","communication","b2b","b2c",
    "venture capital","fundraising","pitch deck","business model","go-to-market",
  ],
  design: [
    "figma","ui","ux","photoshop","illustrator","graphic design","motion","typography",
    "wireframe","prototype","canva","sketch","adobe xd","3d","branding","logo",
    "color theory","animation","after effects","blender","user research","design system",
    "ui/ux","interaction design","visual design","product design",
  ],
  marketing: [
    "seo","content marketing","social media","email marketing","google ads","meta ads",
    "facebook ads","copywriting","analytics","growth hacking","digital marketing",
    "instagram","youtube","influencer","affiliate","ppc","cro","funnel","campaign",
    "brand","sem","performance marketing","inbound","outbound","crm","hubspot",
  ],
  finance: [
    "accounting","stock market","investing","gst","taxation","excel","crypto",
    "valuation","financial modeling","trading","equity","mutual funds","ca","cfa",
    "budgeting","cash flow","balance sheet","wealth management","fintech",
    "chartered accountant","tally","quickbooks","blockchain","defi","options","futures",
  ],
  personal: [
    "public speaking","time management","productivity","mindfulness","communication",
    "critical thinking","negotiation","goal setting","emotional intelligence","habit",
    "confidence","motivation","journaling","stress","decision making","self improvement",
    "mental health","work life balance","career","interview","resume","linkedin",
  ],
  language: [
    "english","hindi","french","german","spanish","ielts","toefl","japanese","grammar",
    "vocabulary","fluency","speaking","pronunciation","chinese","arabic","korean",
    "sanskrit","portuguese","italian","russian","mandarin","business english",
  ],
  health: [
    "yoga","fitness","nutrition","meditation","weight loss","strength training",
    "mental health","ayurveda","running","sports","diet","exercise","workout",
    "wellness","pilates","zumba","marathon","crossfit","physiotherapy","sleep",
  ],
};

/** Map a free-text category string → keyword bucket key */
function normalizeCategoryKey(category: string): string | null {
  const c = category.toLowerCase();
  if (c.includes("develop") || c.includes("program") || c.includes("coding") ||
      c.includes("software") || c.includes("web") || c === "it" || c.startsWith("it ") ||
      c.includes("tech") || c.includes("engineer"))
    return "development";
  if (c.includes("data") || c.includes("ai") || c.includes("machine") ||
      c.includes("science") || c.includes("analytics"))
    return "data";
  if (c.includes("business") || c.includes("entrepreneur") || c.includes("management") ||
      c.includes("startup"))
    return "business";
  if (c.includes("design") || c.includes("creative") || c.includes("ui") || c.includes("ux"))
    return "design";
  if (c.includes("market") || c.includes("seo") || c.includes("advertising"))
    return "marketing";
  if (c.includes("finance") || c.includes("account") || c.includes("invest") ||
      c.includes("trading"))
    return "finance";
  if (c.includes("personal") || c.includes("self") || c.includes("career") ||
      c.includes("productivity"))
    return "personal";
  if (c.includes("language") || c.includes("english") || c.includes("speak") ||
      c.includes("ielts") || c.includes("toefl"))
    return "language";
  if (c.includes("health") || c.includes("fitness") || c.includes("yoga") ||
      c.includes("wellness") || c.includes("nutrition"))
    return "health";
  return null;
}

// ─────────────────────────────────────────────────────────────
// 1. Title (15 pts)
// ─────────────────────────────────────────────────────────────

const BANNED_TITLE_WORDS = [
  "untitled","test course","my course","new course","draft","aaa","bbb","xxx",
  "course 1","course1","sample","hello world",
];

function scoreTitle(title: string): DimensionScore {
  const t = title.trim();
  const lower = t.toLowerCase();
  const len = t.length;

  const isBanned = BANNED_TITLE_WORDS.some((b) => lower.includes(b));
  if (isBanned) {
    return { score: 0, max: 15, reason: `Title contains a generic/banned phrase ("${t}")` };
  }
  if (len < 5) {
    return { score: 0, max: 15, reason: `Title too short (${len} chars) — minimum 5` };
  }

  const isAllCaps = t === t.toUpperCase() && /[A-Z]/.test(t);
  if (isAllCaps) {
    return { score: 5, max: 15, reason: "Title is ALL CAPS — use proper sentence casing" };
  }

  if (len >= 10 && len <= 80) {
    return { score: 15, max: 15, reason: `Clear, well-formed title (${len} chars)` };
  }
  if (len < 10) {
    return { score: 8, max: 15, reason: `Title is short (${len} chars) — aim for 10–80 chars` };
  }
  // len > 80
  return { score: 8, max: 15, reason: `Title too long (${len} chars) — keep under 80` };
}

// ─────────────────────────────────────────────────────────────
// 2. Description (15 pts)
// ─────────────────────────────────────────────────────────────

function scoreDescription(desc: string): DimensionScore {
  const len = desc.trim().length;
  if (len < 50)  return { score: 0,  max: 15, reason: `Description too short (${len} chars) — minimum 50` };
  if (len < 100) return { score: 5,  max: 15, reason: `Description brief (${len} chars) — aim for 300+` };
  if (len < 300) return { score: 10, max: 15, reason: `Description acceptable (${len} chars) — more detail recommended` };
  if (len < 500) return { score: 13, max: 15, reason: `Good description (${len} chars)` };
  return              { score: 15, max: 15, reason: `Excellent description (${len} chars)` };
}

// ─────────────────────────────────────────────────────────────
// 3. Learning Outcomes (10 pts)
// ─────────────────────────────────────────────────────────────

function scoreOutcomes(outcomes: string[]): DimensionScore {
  const valid = outcomes.filter((o) => o.trim().length >= 10);
  const count = valid.length;
  if (count === 0) return { score: 0, max: 10, reason: "No learning outcomes provided (add at least 5)" };
  if (count === 1) return { score: 3, max: 10, reason: "Only 1 outcome — add at least 3" };
  if (count === 2) return { score: 5, max: 10, reason: "Only 2 outcomes — add at least 3" };
  if (count === 3) return { score: 7, max: 10, reason: "3 outcomes provided" };
  if (count === 4) return { score: 8, max: 10, reason: "4 outcomes provided" };
  return                  { score: 10, max: 10, reason: `${count} clear learning outcomes ✓` };
}

// ─────────────────────────────────────────────────────────────
// 4. Curriculum Depth (20 pts)
// ─────────────────────────────────────────────────────────────

function scoreCurriculum(modules: CourseInput["modules"]): DimensionScore {
  const moduleCount = modules.length;
  const lessons = modules.flatMap((m) => m.lessons);
  const lessonCount = lessons.length;
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const hasPreview = lessons.some((l) => l.isPreview);

  let score = 0;
  const parts: string[] = [];

  // Modules (5 pts)
  if (moduleCount === 0) {
    parts.push("no modules");
  } else if (moduleCount === 1) {
    score += 3; parts.push("1 module");
  } else {
    score += 5; parts.push(`${moduleCount} modules`);
  }

  // Lessons (5 pts)
  if (lessonCount === 0) {
    parts.push("no lessons");
  } else if (lessonCount < 3) {
    score += 3; parts.push(`${lessonCount} lesson${lessonCount > 1 ? "s" : ""} (add more)`);
  } else {
    score += 5; parts.push(`${lessonCount} lessons`);
  }

  // Duration (7 pts)
  if (totalDuration === 0) {
    parts.push("no durations set");
  } else if (totalDuration < 30) {
    score += 3; parts.push(`${totalDuration} mins total (aim for 60+)`);
  } else if (totalDuration < 60) {
    score += 5; parts.push(`${totalDuration} mins total`);
  } else {
    score += 7; parts.push(`${totalDuration} mins total`);
  }

  // Free preview lesson (3 pts)
  if (hasPreview) {
    score += 3; parts.push("free preview lesson ✓");
  } else {
    parts.push("no free preview lesson");
  }

  return { score, max: 20, reason: parts.join(", ") };
}

// ─────────────────────────────────────────────────────────────
// 5a. Rule-based category match (10 pts)
// ─────────────────────────────────────────────────────────────

function scoreSkillsMatch(courseSkills: string[], category: string): DimensionScore {
  const catKey = normalizeCategoryKey(category);
  if (!catKey) {
    return { score: 5, max: 10, reason: `Category "${category}" not in recognised taxonomy — neutral score` };
  }

  const keywords = CATEGORY_KEYWORDS[catKey] ?? [];
  const normalizedSkills = courseSkills.map((s) => s.toLowerCase().replace(/[.\s]/g, ""));

  if (courseSkills.length === 0) {
    return { score: 3, max: 10, reason: "No course skills tagged — add relevant skill tags" };
  }

  const matchCount = normalizedSkills.filter((skill) =>
    keywords.some((kw) => {
      const nkw = kw.replace(/[.\s]/g, "");
      return nkw.includes(skill) || skill.includes(nkw);
    })
  ).length;

  const matchRatio = Math.min(matchCount / Math.min(courseSkills.length, 5), 1);
  const score = Math.round(matchRatio * 10);
  const topSkills = courseSkills.slice(0, 3).join(", ");

  if (matchCount === 0) {
    return {
      score,
      max: 10,
      reason: `Skills (${topSkills}) don't match category "${category}"`,
    };
  }
  return {
    score,
    max: 10,
    reason: `${matchCount}/${courseSkills.length} skill${matchCount > 1 ? "s" : ""} match category "${category}"`,
  };
}

// ─────────────────────────────────────────────────────────────
// 5b. Claude AI semantic validation (10 pts)
// ─────────────────────────────────────────────────────────────

async function claudeCategoryScore(
  title: string,
  description: string,
  category: string,
  courseSkills: string[]
): Promise<DimensionScore> {
  if (!aiConfigured()) {
    return { score: 5, max: 10, reason: "AI not configured — keyword fallback score applied" };
  }

  const skillsList = courseSkills.length > 0 ? courseSkills.slice(0, 8).join(", ") : "None listed";
  const descSnippet = description.trim().slice(0, 400);

  const prompt =
    `You are a strict course quality auditor for an online learning platform.\n` +
    `Score how genuinely the course content matches its stated category.\n\n` +
    `Category: ${category}\n` +
    `Title: ${title}\n` +
    `Skills tagged: ${skillsList}\n` +
    `Description preview: ${descSnippet}\n\n` +
    `Reply ONLY with a single line of raw JSON — no markdown, no extra text:\n` +
    `{"score":<integer 0-10>,"reason":"<one concise sentence>"}`;

  const result = await callClaude({
    system: "You are a course quality auditor. Always reply with raw JSON only — no markdown.",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 120,
  });

  if (!result.ok || !result.text) {
    return { score: 5, max: 10, reason: "AI check failed — neutral score applied" };
  }

  try {
    // Strip possible markdown code fences if model misbehaves
    const clean = result.text.replace(/```[a-z]*\n?/gi, "").trim();
    const parsed = JSON.parse(clean) as { score: unknown; reason: unknown };
    const score = Math.max(0, Math.min(10, Number(parsed.score) || 0));
    const reason = typeof parsed.reason === "string" ? parsed.reason : "Semantic check completed";
    return { score, max: 10, reason };
  } catch {
    return { score: 5, max: 10, reason: "AI response parse error — neutral score applied" };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. Instructor track record (20 pts)
// ─────────────────────────────────────────────────────────────

function scoreTrackRecord(
  publishedCourses: TeacherInput["publishedCourses"]
): DimensionScore & { isNewTeacher: boolean } {
  const total = publishedCourses.length;

  // New teacher: fewer than 10 published courses total
  if (total < 10) {
    return {
      score: 15,
      max: 20,
      reason: `New instructor (${total} published course${total === 1 ? "" : "s"}) — track record check skipped`,
      isNewTeacher: true,
    };
  }

  // Established teacher — score based on avg rating of last 10 courses
  const last10 = publishedCourses.slice(0, 10);
  const allRatings = last10.flatMap((c) => c.reviews.map((r) => r.rating));

  if (allRatings.length === 0) {
    return {
      score: 10,
      max: 20,
      reason: "Established instructor — no reviews on last 10 courses yet",
      isNewTeacher: false,
    };
  }

  const avg = allRatings.reduce((s, r) => s + r, 0) / allRatings.length;
  const avgStr = avg.toFixed(1);

  let score: number;
  if (avg >= 4.5) score = 20;
  else if (avg >= 4.0) score = 16;
  else if (avg >= 3.5) score = 12;
  else if (avg >= 3.0) score = 8;
  else score = 4;

  return {
    score,
    max: 20,
    reason: `Avg rating ${avgStr}⭐ across ${allRatings.length} review${allRatings.length > 1 ? "s" : ""} (last 10 courses)`,
    isNewTeacher: false,
  };
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export async function scoreCourse(
  course: CourseInput,
  teacher: TeacherInput
): Promise<ScoreResult> {
  // Run all pure/synchronous checks first
  const title        = scoreTitle(course.title);
  const description  = scoreDescription(course.description);
  const outcomes     = scoreOutcomes(course.outcomes);
  const curriculum   = scoreCurriculum(course.modules);
  const skillsRule   = scoreSkillsMatch(course.courseSkills, course.category);
  const trackRecord  = scoreTrackRecord(teacher.publishedCourses);

  // Claude semantic check (async, 10 pts portion of category match)
  let claudeScore: DimensionScore;
  let claudeUsed = false;

  if (aiConfigured()) {
    claudeScore = await claudeCategoryScore(
      course.title,
      course.description,
      course.category,
      course.courseSkills
    );
    claudeUsed = true;
  } else {
    // Fallback: use rule score doubled (cap at 10) so category stays out of 20
    claudeScore = {
      score: Math.min(skillsRule.score, 10),
      max: 10,
      reason: "AI unavailable — keyword match used for semantic portion",
    };
  }

  const categoryMatch: DimensionScore = {
    score: skillsRule.score + claudeScore.score,
    max: 20,
    reason: `Skills: ${skillsRule.reason} | Semantic: ${claudeScore.reason}`,
  };

  const total =
    title.score +
    description.score +
    outcomes.score +
    curriculum.score +
    categoryMatch.score +
    trackRecord.score;

  return {
    total,
    autoApprove: total >= 80,
    claudeUsed,
    breakdown: {
      title,
      description,
      outcomes,
      curriculum,
      categoryMatch,
      trackRecord,
    },
  };
}
