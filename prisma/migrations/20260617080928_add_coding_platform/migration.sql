-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('BEGINNER', 'LEARNER', 'SOLVER', 'ADVANCED', 'EXPERT', 'MASTER', 'GRANDMASTER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'AC', 'WA', 'TLE', 'RE', 'CE');

-- AlterTable
ALTER TABLE "CourseLesson" ADD COLUMN     "challengeId" INTEGER;

-- CreateTable
CREATE TABLE "Problem" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "constraints" TEXT NOT NULL DEFAULT '',
    "hints" TEXT NOT NULL DEFAULT '',
    "starterCode" JSONB,
    "timeLimit" INTEGER NOT NULL DEFAULT 2,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" SERIAL NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "problemId" INTEGER NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "problemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CodingSubmission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "runtime" INTEGER,
    "memory" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "contestId" INTEGER,

    CONSTRAINT "CodingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestProblem" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "contestId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,

    CONSTRAINT "ContestProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" SERIAL NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "rank" "Rank" NOT NULL DEFAULT 'BEGINNER',
    "studentId" TEXT NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "threshold" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 15,
    "problemId" INTEGER NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingStreak" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "studentId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,

    CONSTRAINT "CodingStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StudentToUserBadge" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_DailyChallengeToStudent" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Problem_slug_idx" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Problem_difficulty_published_idx" ON "Problem"("difficulty", "published");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTag_problemId_tagId_key" ON "ProblemTag"("problemId", "tagId");

-- CreateIndex
CREATE INDEX "CodingSubmission_studentId_status_idx" ON "CodingSubmission"("studentId", "status");

-- CreateIndex
CREATE INDEX "CodingSubmission_studentId_problemId_idx" ON "CodingSubmission"("studentId", "problemId");

-- CreateIndex
CREATE INDEX "Contest_startTime_endTime_idx" ON "Contest"("startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_problemId_key" ON "ContestProblem"("contestId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_studentId_key" ON "UserStats"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_name_key" ON "UserBadge"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CodingStreak_studentId_date_key" ON "CodingStreak"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "_StudentToUserBadge_AB_unique" ON "_StudentToUserBadge"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentToUserBadge_B_index" ON "_StudentToUserBadge"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DailyChallengeToStudent_AB_unique" ON "_DailyChallengeToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_DailyChallengeToStudent_B_index" ON "_DailyChallengeToStudent"("B");

-- AddForeignKey
ALTER TABLE "CourseLesson" ADD CONSTRAINT "CourseLesson_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingStreak" ADD CONSTRAINT "CodingStreak_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingStreak" ADD CONSTRAINT "CodingStreak_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToUserBadge" ADD CONSTRAINT "_StudentToUserBadge_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToUserBadge" ADD CONSTRAINT "_StudentToUserBadge_B_fkey" FOREIGN KEY ("B") REFERENCES "UserBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyChallengeToStudent" ADD CONSTRAINT "_DailyChallengeToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyChallengeToStudent" ADD CONSTRAINT "_DailyChallengeToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
