import { NextResponse } from "next/server";
import { Rank } from "@prisma/client";
import { runTestCases, LANGUAGES } from "@/lib/judge0";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cacheDelPattern } from "@/lib/redis";

// XP rewards per difficulty
const XP_MAP: Record<string, number> = {
  EASY: 10,
  MEDIUM: 25,
  HARD: 50,
};

function getRank(xp: number): Rank {
  if (xp >= 15000) return "GRANDMASTER";
  if (xp >= 8000) return "MASTER";
  if (xp >= 4000) return "EXPERT";
  if (xp >= 1500) return "ADVANCED";
  if (xp >= 500) return "SOLVER";
  if (xp >= 100) return "LEARNER";
  return "BEGINNER";
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemSlug, source, languageId } = await req.json();

    if (!problemSlug || !source || !languageId) {
      return NextResponse.json(
        { error: "Missing problemSlug, source, or languageId" },
        { status: 400 }
      );
    }

    // Validate language
    const langEntry = Object.values(LANGUAGES).find((l) => l.id === languageId);
    const langName = langEntry?.name || "Unknown";

    // Fetch problem with all test cases
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      include: {
        testCases: { orderBy: { order: "asc" } },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    if (problem.testCases.length === 0) {
      return NextResponse.json(
        { error: "Problem has no test cases" },
        { status: 400 }
      );
    }

    // Run all test cases
    const testCaseData = problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    const result = await runTestCases(
      source,
      languageId,
      testCaseData,
      problem.timeLimit,
      problem.memoryLimit
    );

    // Find the student record
    const student = await prisma.student.findUnique({
      where: { id: session.userId },
    });

    if (!student) {
      // Could be a teacher/admin - store submission but skip gamification
      const submission = await prisma.codingSubmission.create({
        data: {
          code: source,
          language: langName,
          status: result.status as any,
          runtime: result.results[0]?.time ? Math.round(parseFloat(result.results[0].time) * 1000) : null,
          memory: result.results[0]?.memory ? Math.round(result.results[0].memory) : null,
          studentId: session.userId,
          problemId: problem.id,
        },
      });

      return NextResponse.json({
        submissionId: submission.id,
        status: result.status,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        runtime: submission.runtime,
        memory: submission.memory,
        results: result.results.map((r, i) => ({
          testCase: i + 1,
          status: r.status,
          stdout: r.stdout,
          stderr: r.stderr,
          compile_output: r.compile_output,
          expected: testCaseData[i].expectedOutput,
          input: testCaseData[i].input,
        })),
      });
    }

    // Use a transaction to atomically update stats + create submission
    const submission = await prisma.$transaction(async (tx) => {
      // Create the submission record
      const sub = await tx.codingSubmission.create({
        data: {
          code: source,
          language: langName,
          status: result.status as any,
          runtime: result.results[0]?.time ? Math.round(parseFloat(result.results[0].time) * 1000) : null,
          memory: result.results[0]?.memory ? Math.round(result.results[0].memory) : null,
          studentId: session.userId,
          problemId: problem.id,
        },
      });

      // Update UserStats
      const stats = await tx.userStats.upsert({
        where: { studentId: session.userId },
        create: {
          studentId: session.userId,
          xp: 0,
          problemsSolved: 0,
          totalSubmissions: 1,
          streak: 0,
          rank: "BEGINNER",
        },
        update: {
          totalSubmissions: { increment: 1 },
        },
      });

      // If AC and first time solving this problem
      if (result.status === "AC") {
        const previousAC = await tx.codingSubmission.findFirst({
          where: {
            studentId: session.userId,
            problemId: problem.id,
            status: "AC",
            id: { not: sub.id },
          },
        });

        if (!previousAC) {
          const xpGain = XP_MAP[problem.difficulty] || 10;
          const newXP = stats.xp + xpGain;
          const newProblemsSolved = stats.problemsSolved + 1;

          await tx.userStats.update({
            where: { studentId: session.userId },
            data: {
              xp: newXP,
              problemsSolved: newProblemsSolved,
              rank: getRank(newXP),
            },
          });
        }

        // Update coding streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await tx.codingStreak.upsert({
          where: {
            studentId_date: {
              studentId: session.userId,
              date: today,
            },
          },
          create: {
            studentId: session.userId,
            problemId: problem.id,
            date: today,
            count: 1,
          },
          update: {
            count: { increment: 1 },
          },
        });

        // Update UserStats streak (consecutive days)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayStreak = await tx.codingStreak.findFirst({
          where: {
            studentId: session.userId,
            date: yesterday,
          },
        });

        const currentStats = await tx.userStats.findUnique({
          where: { studentId: session.userId },
        });

        const newStreak = yesterdayStreak
          ? (currentStats?.streak || 0) + 1
          : 1;

        await tx.userStats.update({
          where: { studentId: session.userId },
          data: { streak: newStreak },
        });
      }

      return sub;
    });

    // Invalidate cached leaderboard
    await cacheDelPattern("leaderboard:*");

    return NextResponse.json({
      submissionId: submission.id,
      status: result.status,
      passedCount: result.passedCount,
      totalCount: result.totalCount,
      runtime: submission.runtime,
      memory: submission.memory,
      results: result.results.map((r, i) => ({
        testCase: i + 1,
        status: r.status,
        stdout: r.stdout,
        stderr: r.stderr,
        compile_output: r.compile_output,
        expected: testCaseData[i].expectedOutput,
        input: testCaseData[i].input,
      })),
    });
  } catch (error) {
    console.error("Code submit error:", error);
    return NextResponse.json(
      { error: "Submission failed", details: String(error) },
      { status: 500 }
    );
  }
}
