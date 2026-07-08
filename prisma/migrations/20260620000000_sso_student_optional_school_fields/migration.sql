-- Relax legacy school-LMS columns on Student so SSO-provisioned marketplace
-- learners (JobNest job seekers) can exist as Students without a
-- parent/class/grade. Existing rows keep their values.
ALTER TABLE "Student" ALTER COLUMN "address" SET DEFAULT '';
ALTER TABLE "Student" ALTER COLUMN "bloodType" SET DEFAULT '';
ALTER TABLE "Student" ALTER COLUMN "sex" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "birthday" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "parentId" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "classId" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "gradeId" DROP NOT NULL;
