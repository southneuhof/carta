/*
  Warnings:

  - A unique constraint covering the columns `[live_for_id]` on the table `PageTranslation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VerificationStatusCode" AS ENUM ('PUBLISHED', 'DRAFT');

-- CreateEnum
CREATE TYPE "VerificationAction" AS ENUM ('APPROVE', 'REVISE');

-- AlterTable
ALTER TABLE "PageTranslation" ADD COLUMN     "live_for_id" TEXT,
ADD COLUMN     "status_code" "VerificationStatusCode" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "ArticleTranslation" ADD COLUMN     "live_for_id" TEXT,
ADD COLUMN     "status_code" "VerificationStatusCode" NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "action" "VerificationAction" NOT NULL,
    "description" TEXT,
    "verifier_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL,
    "data_id" TEXT NOT NULL,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageTranslation_live_for_id_key" ON "PageTranslation"("live_for_id");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_live_for_id_key" ON "ArticleTranslation"("live_for_id");

-- AddForeignKey
ALTER TABLE "PageTranslation" ADD CONSTRAINT "PageTranslation_live_for_id_fkey" FOREIGN KEY ("live_for_id") REFERENCES "PageTranslation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_live_for_id_fkey" FOREIGN KEY ("live_for_id") REFERENCES "ArticleTranslation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
