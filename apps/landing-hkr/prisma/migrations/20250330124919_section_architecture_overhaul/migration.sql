/*
  Warnings:

  - You are about to drop the column `page_translation_id` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `parent_section_id` on the `Section` table. All the data in the column will be lost.
  - Made the column `section_group_id` on table `Section` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_page_translation_id_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_parent_section_id_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_section_group_id_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "page_translation_id",
DROP COLUMN "parent_section_id",
ALTER COLUMN "section_group_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "SectionGroup" ADD COLUMN     "page_translation_id" TEXT;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_section_group_id_fkey" FOREIGN KEY ("section_group_id") REFERENCES "SectionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionGroup" ADD CONSTRAINT "SectionGroup_page_translation_id_fkey" FOREIGN KEY ("page_translation_id") REFERENCES "PageTranslation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
