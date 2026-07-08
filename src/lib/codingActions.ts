"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ Problem CRUD (Admin only) ============

export const createProblem = async (data: {
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  constraints?: string;
  hints?: string;
  starterCode?: Record<string, string>;
  timeLimit?: number;
  memoryLimit?: number;
  tags?: number[];
}) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      difficulty: data.difficulty as any,
      constraints: data.constraints || "",
      hints: data.hints || "",
      starterCode: data.starterCode || undefined,
      timeLimit: data.timeLimit || 2,
      memoryLimit: data.memoryLimit || 256,
    },
  });

  if (data.tags?.length) {
    await prisma.problemTag.createMany({
      data: data.tags.map((tagId) => ({ problemId: problem.id, tagId })),
    });
  }

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  return { problem };
};

export const updateProblem = async (
  problemId: number,
  data: {
    title?: string;
    description?: string;
    difficulty?: string;
    constraints?: string;
    hints?: string;
    starterCode?: Record<string, string>;
    timeLimit?: number;
    memoryLimit?: number;
    published?: boolean;
    isPremium?: boolean;
  }
) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const problem = await prisma.problem.update({
    where: { id: problemId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.difficulty && { difficulty: data.difficulty as any }),
      ...(data.constraints !== undefined && { constraints: data.constraints }),
      ...(data.hints !== undefined && { hints: data.hints }),
      ...(data.starterCode !== undefined && { starterCode: data.starterCode }),
      ...(data.timeLimit && { timeLimit: data.timeLimit }),
      ...(data.memoryLimit && { memoryLimit: data.memoryLimit }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.isPremium !== undefined && { isPremium: data.isPremium }),
    },
  });

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  return { problem };
};

export const deleteProblem = async (problemId: number) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.problem.delete({ where: { id: problemId } });
  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  return { success: true };
};

export const addTestCase = async (
  problemId: number,
  input: string,
  expectedOutput: string,
  isSample: boolean
) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const maxOrder = await prisma.testCase.aggregate({
    where: { problemId },
    _max: { order: true },
  });

  const tc = await prisma.testCase.create({
    data: {
      problemId,
      input,
      expectedOutput,
      isSample,
      order: (maxOrder._max.order || 0) + 1,
    },
  });

  revalidatePath("/admin/problems");
  return { testCase: tc };
};

export const updateTestCase = async (
  testCaseId: number,
  input: string,
  expectedOutput: string,
  isSample: boolean
) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const tc = await prisma.testCase.update({
    where: { id: testCaseId },
    data: { input, expectedOutput, isSample },
  });

  revalidatePath("/admin/problems");
  return { testCase: tc };
};

export const deleteTestCase = async (testCaseId: number) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.testCase.delete({ where: { id: testCaseId } });
  revalidatePath("/admin/problems");
  return { success: true };
};

export const setProblemTags = async (problemId: number, tagIds: number[]) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.problemTag.deleteMany({ where: { problemId } });
  if (tagIds.length) {
    await prisma.problemTag.createMany({
      data: tagIds.map((tagId) => ({ problemId, tagId })),
    });
  }

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  return { success: true };
};

// ============ LMS Integration ============

export const linkChallengeToLesson = async (lessonId: number, challengeId: number | null) => {
  const session = await getSession();
  if (!session?.userId || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized" };
  }

  await prisma.courseLesson.update({
    where: { id: lessonId },
    data: { challengeId },
  });

  revalidatePath("/courses");
  return { success: true };
};

// ============ Daily Challenge Management (Admin) ============

export const setDailyChallenge = async (date: string, problemId: number, xpReward: number = 15) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  await prisma.dailyChallenge.upsert({
    where: { date: d },
    update: { problemId, xpReward },
    create: { date: d, problemId, xpReward },
  });

  revalidatePath("/admin/challenges");
  return { success: true };
};

export const deleteDailyChallenge = async (date: string) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  await prisma.dailyChallenge.delete({ where: { date: d } });
  revalidatePath("/admin/challenges");
  return { success: true };
};
