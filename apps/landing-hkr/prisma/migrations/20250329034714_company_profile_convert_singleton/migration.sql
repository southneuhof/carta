/*
  Warnings:

  - You are about to drop the `CompanyProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CompanyProfile";

-- CreateTable
CREATE TABLE "company_profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT,
    "slogan" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "whatsapp" TEXT,
    "brochure" TEXT,

    CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profile_id_key" ON "company_profile"("id");
