/*
  Warnings:

  - You are about to drop the `ImageManifest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "cta" TEXT,
ADD COLUMN     "cta_text" TEXT;

-- DropTable
DROP TABLE "ImageManifest";
