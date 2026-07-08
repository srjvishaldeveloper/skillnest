"use server";

import prisma from "./prisma";
import { getSession } from "./auth";
import { callClaude, aiConfigured, type ChatMessage } from "./ai";

export const aiIsConfigured = async () => aiConfigured();

// participation gate: enrolled learner, course instructor, or admin
async function canAccessCourse(courseId: number) {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return session;
  if (session.role === "teacher") {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    return course && course.instructorId === session.userId ? session : null;
  }
  if (session.role === "student") {
    const e = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.userId, courseId } },
    });
    return e ? session : null;
  }
  return null;
}

/** Course-aware doubt-solving tutor. */
export const askTutor = async (
  courseId: number,
  history: ChatMessage[],
  question: string
) => {
  if (!aiConfigured()) {
    return { ok: false, error: "AI tutor is not configured yet." };
  }
  const allowed = await canAccessCourse(courseId);
  if (!allowed) return { ok: false, error: "Enroll in this course to use the tutor." };
  if (!question.trim()) return { ok: false, error: "Ask a question first." };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      category: true,
      description: true,
      modules: {
        orderBy: { order: "asc" },
        select: { title: true, lessons: { select: { title: true } } },
      },
    },
  });
  if (!course) return { ok: false, error: "Course not found." };

  const curriculum = course.modules
    .map(
      (m) => `- ${m.title}: ${m.lessons.map((l) => l.title).join(", ")}`
    )
    .join("\n");

  const system = `You are SkillNest's friendly AI tutor for the course "${course.title}" (${course.category}).
Course summary: ${course.description || "n/a"}
Curriculum:
${curriculum}

Help the learner understand concepts and solve their doubts. Explain clearly and concisely with small examples. Guide their thinking rather than just dumping answers; for coding, show short snippets. Keep answers focused and encouraging. If a question is unrelated to the course, gently steer back.`;

  // keep the last 8 turns for context
  const trimmed = history.slice(-8);
  const messages: ChatMessage[] = [
    ...trimmed,
    { role: "user", content: question.trim() },
  ];

  const res = await callClaude({ system, messages, maxTokens: 1024 });
  return res;
};

/** Summarize a single lesson into revision notes + key points. */
export const generateNotes = async (lessonId: number) => {
  if (!aiConfigured()) {
    return { ok: false, error: "AI notes are not configured yet." };
  }

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: {
      title: true,
      content: true,
      module: { select: { courseId: true, course: { select: { title: true } } } },
    },
  });
  if (!lesson) return { ok: false, error: "Lesson not found." };

  const allowed = await canAccessCourse(lesson.module.courseId);
  if (!allowed) return { ok: false, error: "Enroll to generate notes." };

  const system = `You are SkillNest's study-notes generator. Produce concise, well-structured revision notes for a learner. Use short markdown: a one-line summary, then 4-7 bullet "Key Points", then a one-line "Remember this". Keep it tight and skimmable.`;

  const source = `Course: ${lesson.module.course.title}
Lesson: ${lesson.title}
Lesson content/notes:
${lesson.content || "(no written content — base the notes on the lesson title and typical curriculum for this topic.)"}`;

  const res = await callClaude({
    system,
    messages: [{ role: "user", content: source }],
    maxTokens: 700,
  });
  return res;
};
