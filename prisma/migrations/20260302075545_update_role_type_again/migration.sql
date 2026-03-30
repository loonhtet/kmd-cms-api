/*
  Warnings:

  - You are about to drop the column `slug` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `lastActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sidebar` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_blogId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropIndex
DROP INDEX "Blog_slug_key";

-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastActive";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Sidebar";
