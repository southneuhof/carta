/*
  Warnings:

  - You are about to drop the column `sectionStructure` on the `SectionType` table. All the data in the column will be lost.
  - Added the required column `code` to the `SectionType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SectionType" DROP COLUMN "sectionStructure",
ADD COLUMN     "code" TEXT NOT NULL;
