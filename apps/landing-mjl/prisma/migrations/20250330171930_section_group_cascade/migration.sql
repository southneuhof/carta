/*
  Warnings:

  - You are about to drop the column `structure` on the `SectionType` table. All the data in the column will be lost.
  - Added the required column `sectionStructure` to the `SectionType` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PageTranslation" DROP CONSTRAINT "PageTranslation_page_id_fkey";

-- DropForeignKey
ALTER TABLE "SectionGroup" DROP CONSTRAINT "SectionGroup_page_translation_id_fkey";

-- AlterTable
ALTER TABLE "SectionType" DROP COLUMN "structure",
ADD COLUMN     "sectionStructure" JSONB NOT NULL;

-- AddForeignKey
ALTER TABLE "PageTranslation" ADD CONSTRAINT "PageTranslation_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionGroup" ADD CONSTRAINT "SectionGroup_page_translation_id_fkey" FOREIGN KEY ("page_translation_id") REFERENCES "PageTranslation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
