"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const createContest = async (
  title: string,
  description: string,
  startTime: string,
  endTime: string
) => {
  const session = await getSession();
  if (!session?.userId || session.role == "student" || session.role=="parent") {
    return { error: "Unauthorized" };
  }

  const contest = await prisma.contest.create({
    data: {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });

  revalidatePath("/admin/contests");
  revalidatePath("/contests");
  return { contest };
};

export const updateContest = async (
  contestId: number,
  data: { title?: string; description?: string; startTime?: string; endTime?: string }
) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const contest = await prisma.contest.update({
    where: { id: contestId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startTime && { startTime: new Date(data.startTime) }),
      ...(data.endTime && { endTime: new Date(data.endTime) }),
    },
  });

  revalidatePath("/admin/contests");
  revalidatePath("/contests");
  return { contest };
};

export const publishContest = async (contestId: number) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.contest.update({
    where: { id: contestId },
    data: { published: true },
  });

  revalidatePath("/admin/contests");
  revalidatePath("/contests");
  return { success: true };
};

export const addProblemToContest = async (
  contestId: number,
  problemId: number,
  points: number
) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const maxOrder = await prisma.contestProblem.aggregate({
    where: { contestId },
    _max: { order: true },
  });

  await prisma.contestProblem.create({
    data: {
      contestId,
      problemId,
      points,
      order: (maxOrder._max.order || 0) + 1,
    },
  });

  revalidatePath(`/admin/contests`);
  return { success: true };
};

export const removeProblemFromContest = async (
  contestId: number,
  problemId: number
) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.contestProblem.deleteMany({
    where: { contestId, problemId },
  });

  revalidatePath(`/admin/contests`);
  return { success: true };
};

export const deleteContest = async (contestId: number) => {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.contest.delete({ where: { id: contestId } });

  revalidatePath("/admin/contests");
  revalidatePath("/contests");
  return { success: true };
};
