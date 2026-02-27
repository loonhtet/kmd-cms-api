-- CreateTable
CREATE TABLE "Sidebar" (
    "id" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "tab" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sidebar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sidebar_role_idx" ON "Sidebar"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Sidebar_role_tab_key" ON "Sidebar"("role", "tab");
