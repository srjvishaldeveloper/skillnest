"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const getUserStats = async (studentId: string) => {
  return prisma.userStats.findUnique({
    where: { studentId },
    include: { student: { select: { name: true } } },
  });
};

export const getUserBadges = async (studentId: string) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { badges: true },
  });
  return student?.badges || [];
};

export const getStreakData = async (studentId: string) => {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  last30Days.setHours(0, 0, 0, 0);

  return prisma.codingStreak.findMany({
    where: {
      studentId,
      date: { gte: last30Days },
    },
    orderBy: { date: "asc" },
  });
};

export const awardBadge = async (studentId: string, badgeName: string) => {
  const badge = await prisma.userBadge.findUnique({ where: { name: badgeName } });
  if (!badge) return { error: "Badge not found" };

  const already = await prisma.student.findFirst({
    where: { id: studentId, badges: { some: { id: badge.id } } },
  });
  if (already) return { error: "Badge already awarded" };

  await prisma.student.update({
    where: { id: studentId },
    data: { badges: { connect: { id: badge.id } } },
  });

  revalidatePath("/leaderboard");
  return { success: true };
};

export const checkAndAwardBadges = async (studentId: string) => {
  const stats = await prisma.userStats.findUnique({ where: { studentId } });
  if (!stats) return;

  const badges: { name: string; threshold: number; value: number }[] = [
    { name: "First Solve", threshold: 1, value: stats.problemsSolved },
    { name: "10 Problems", threshold: 10, value: stats.problemsSolved },
    { name: "50 Problems", threshold: 50, value: stats.problemsSolved },
    { name: "100 Problems", threshold: 100, value: stats.problemsSolved },
    { name: "7 Day Streak", threshold: 7, value: stats.streak },
    { name: "30 Day Streak", threshold: 30, value: stats.streak },
  ];

  for (const b of badges) {
    if (b.value >= b.threshold) {
      await awardBadge(studentId, b.name);
    }
  }
};

export const claimDailyChallenge = async () => {
  const session = await getSession();
  if (!session?.userId) return { error: "Unauthorized" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenge = await prisma.dailyChallenge.findUnique({ where: { date: today } });
  if (!challenge) return { error: "No daily challenge today" };

  // Check if already participated
  const already = await prisma.student.findFirst({
    where: { id: session.userId, dailyChallenges: { some: { id: challenge.id } } },
  });
  if (already) return { error: "Already claimed today's challenge" };

  // Check if problem was solved
  const solved = await prisma.codingSubmission.findFirst({
    where: { studentId: session.userId, problemId: challenge.problemId, status: "AC" },
  });
  if (!solved) return { error: "Solve today's challenge first" };

  await prisma.student.update({
    where: { id: session.userId },
    data: { dailyChallenges: { connect: { id: challenge.id } } },
  });

  // Award bonus XP
  const stats = await prisma.userStats.upsert({
    where: { studentId: session.userId },
    create: { studentId: session.userId, xp: challenge.xpReward, rank: "BEGINNER" },
    update: { xp: { increment: challenge.xpReward } },
  });

  revalidatePath("/problems");
  revalidatePath("/leaderboard");
  return { success: true, xpEarned: challenge.xpReward };
};

export const getTodayChallenge = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: { problem: { select: { slug: true, title: true, difficulty: true } } },
  });
};
