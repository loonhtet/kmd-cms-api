-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('ZOOM', 'TEAM', 'MEET');

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "linkType" "LinkType";
