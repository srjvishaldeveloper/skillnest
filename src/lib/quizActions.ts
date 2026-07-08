"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { getSession } from "./auth";
import { notify } from "./notify";
import { tpl } from "./notifyTemplates";
import { publishPlatformEvent } from "./platformEvents";

// verify the current user owns (or admins) the course behind a quiz/course
async function canManageCourse(courseId: number) {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return session;
  if (session.role !== "teacher") return null;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== session.userId) return null;
  return session;
}

/* ============================ QUIZ ============================ */

export const createQuiz = async (
  courseId: number,
  title: string,
  description: string,
  passingScore: number
) => {
  const session = await canManageCourse(courseId);
  if (!session) return { success: false, error: true };
  if (!title.trim()) return { success: false, error: true, message: "Title required" };

  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      title: title.trim(),
      description: description.trim(),
      passingScore: Math.min(100, Math.max(0, Math.round(passingScore || 60))),
    },
  });

  // ── notify enrolled students ──
  if (session.role === "teacher") {
    const [course, teacher, enrolled] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      }),
      prisma.teacher.findUnique({
        where: { id: session.userId },
        select: { name: true },
      }),
      prisma.enrollment.findMany({
        where: { courseId },
        include: { student: { select: { name: true, email: true } } },
      }),
    ]);

    if (course) {
      const authorName = teacher?.name || session.username || "Teacher";
      const contentType = "quiz";
      const announcementTitle = `${authorName} added a new quiz`;

      await prisma.announcement.create({
        data: {
          title: announcementTitle,
          description: `New quiz: ${title.trim()}${description.trim() ? `\n\n${description.trim().slice(0, 200)}` : ""}`,
          date: new Date(),
          authorId: session.userId,
          authorRole: "teacher",
          authorName,
          classId: null,
        },
      });

      for (const enrollment of enrolled) {
        const student = enrollment.student;
        if (student.email) {
          const t = tpl.newContent(student.name, course.title, authorName, contentType, title.trim(), courseId);
          notify({ email: { to: student.email, subject: t.subject, html: t.html } });
        }
      }
    }
  }

  revalidatePath(`/courses/${courseId}`);
  return { success: true, error: false, quizId: quiz.id };
};

export const deleteQuiz = async (quizId: number, courseId: number) => {
  const session = await canManageCourse(courseId);
  if (!session) return;
  await prisma.quiz.delete({ where: { id: quizId } });
  revalidatePath(`/courses/${courseId}`);
};

/* ============================ QUESTIONS ============================ */

export const addQuestion = async (
  quizId: number,
  courseId: number,
  text: string,
  options: { text: string; isCorrect: boolean }[]
) => {
  const session = await canManageCourse(courseId);
  if (!session) return { success: false, error: true };

  const clean = options.filter((o) => o.text.trim());
  if (!text.trim() || clean.length < 2) {
    return { success: false, error: true, message: "Need a question and 2+ options" };
  }
  if (!clean.some((o) => o.isCorrect)) {
    return { success: false, error: true, message: "Mark at least one correct option" };
  }

  const count = await prisma.question.count({ where: { quizId } });
  await prisma.question.create({
    data: {
      quizId,
      text: text.trim(),
      order: count,
      options: {
        create: clean.map((o, i) => ({
          text: o.text.trim(),
          isCorrect: o.isCorrect,
          order: i,
        })),
      },
    },
  });
  revalidatePath(`/courses/${courseId}/quiz/${quizId}`);
  return { success: true, error: false };
};

export const deleteQuestion = async (
  questionId: number,
  quizId: number,
  courseId: number
) => {
  const session = await canManageCourse(courseId);
  if (!session) return;
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/courses/${courseId}/quiz/${quizId}`);
};

/* ============================ ATTEMPTS ============================ */

export const submitQuizAttempt = async (
  quizId: number,
  answers: Record<string, number> // { questionId: selectedOptionId }
) => {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { success: false, error: true, message: "Only learners can take quizzes" };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true } } },
  });
  if (!quiz) return { success: false, error: true, message: "Quiz not found" };

  // must be enrolled in the course
  const enrolled = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: session.userId, courseId: quiz.courseId },
    },
  });
  if (!enrolled) {
    return { success: false, error: true, message: "Enroll in the course first" };
  }

  // grade
  let score = 0;
  const total = quiz.questions.length;
  for (const q of quiz.questions) {
    const selected = answers[String(q.id)];
    const correct = q.options.find((o) => o.isCorrect);
    if (correct && selected === correct.id) score += 1;
  }
  const percent = total ? Math.round((score / total) * 100) : 0;
  const passed = percent >= quiz.passingScore;

  await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId: session.userId,
      score,
      total,
      passed,
      answers,
    },
  });

  // A passed quiz verifies skill confidence on the JobNest profile.
  if (passed) {
    const [courseSkills, student] = await Promise.all([
      prisma.courseSkill.findMany({
        where: { courseId: quiz.courseId },
        select: { skillSlug: true },
      }),
      prisma.student.findUnique({
        where: { id: session.userId },
        select: { email: true },
      }),
    ]);
    if (courseSkills.length) {
      await publishPlatformEvent({
        event: "AssessmentPassed",
        actorUserId: session.userId,
        email: student?.email ?? null,
        idempotencyKey: `assessment:${quizId}:${session.userId}:${percent}`,
        payload: {
          quiz_id: quizId,
          course_id: quiz.courseId,
          skills: courseSkills.map((cs) => cs.skillSlug),
          kind: "mcq",
          score: percent,
        },
      });
    }
  }

  revalidatePath(`/quiz/${quizId}`);
  return { success: true, error: false, score, total, percent, passed };
};
