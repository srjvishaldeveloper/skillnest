-- CreateTable
CREATE TABLE "CourseSkill" (
    "id" SERIAL NOT NULL,
    "skillSlug" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "CourseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillNestProfile" (
    "id" SERIAL NOT NULL,
    "jobnestUserId" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'student',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "SkillNestProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseSkill_skillSlug_idx" ON "CourseSkill"("skillSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSkill_courseId_skillSlug_key" ON "CourseSkill"("courseId", "skillSlug");

-- CreateIndex
CREATE UNIQUE INDEX "SkillNestProfile_jobnestUserId_key" ON "SkillNestProfile"("jobnestUserId");

-- AddForeignKey
ALTER TABLE "CourseSkill" ADD CONSTRAINT "CourseSkill_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
