/*
  Warnings:

  - You are about to drop the `MeetingSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MeetingSchedule" DROP CONSTRAINT "MeetingSchedule_studentId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingSchedule" DROP CONSTRAINT "MeetingSchedule_tutorId_fkey";

-- DropTable
DROP TABLE "MeetingSchedule";
