-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT';
