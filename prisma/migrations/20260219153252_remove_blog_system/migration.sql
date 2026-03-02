/*
  Warnings:

  - You are about to drop the `Blog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlogAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BlogToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_userId_fkey";

-- DropForeignKey
ALTER TABLE "BlogAsset" DROP CONSTRAINT "BlogAsset_blogId_fkey";

-- DropForeignKey
ALTER TABLE "_BlogToTag" DROP CONSTRAINT "_BlogToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_BlogToTag" DROP CONSTRAINT "_BlogToTag_B_fkey";

-- DropTable
DROP TABLE "Blog";

-- DropTable
DROP TABLE "BlogAsset";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_BlogToTag";
