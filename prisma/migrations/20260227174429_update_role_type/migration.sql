/*
  Warnings:
  - The values [ADMIN_STAFF] on the enum `RoleType` will be removed. If these variants are still used in the database, this will fail.
*/

-- Update existing ADMIN_STAFF rows to STAFF first (ADMIN doesn't exist yet at this point)
UPDATE "UserRole" SET role = 'STAFF' WHERE role = 'ADMIN_STAFF';
UPDATE "Sidebar" SET role = 'STAFF' WHERE role = 'ADMIN_STAFF';

-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('STUDENT', 'TUTOR', 'STAFF', 'ADMIN');
ALTER TABLE "UserRole" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TABLE "Sidebar" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "public"."RoleType_old";
COMMIT;
