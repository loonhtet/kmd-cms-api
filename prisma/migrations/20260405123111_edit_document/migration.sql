/*
  Warnings:

  - You are about to drop the column `studentId` on the `Document` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_studentId_fkey";

-- DropIndex
DROP INDEX "Document_studentId_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "studentId";

-- CreateTable
CREATE TABLE "_DocumentToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DocumentToStudent_B_index" ON "_DocumentToStudent"("B");

-- AddForeignKey
ALTER TABLE "_DocumentToStudent" ADD CONSTRAINT "_DocumentToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToStudent" ADD CONSTRAINT "_DocumentToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
