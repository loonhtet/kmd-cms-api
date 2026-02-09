/*
  Warnings:

  - You are about to drop the column `register` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "register",
ADD COLUMN     "resetOTP" TEXT,
ADD COLUMN     "resetOTPExpiry" TIMESTAMP(3);
