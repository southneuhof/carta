/*
  Warnings:

  - You are about to drop the column `section_type_id` on the `Section` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `SectionType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_section_type_id_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "section_type_id",
ADD COLUMN     "section_type_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SectionType_code_key" ON "SectionType"("code");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_section_type_code_fkey" FOREIGN KEY ("section_type_code") REFERENCES "SectionType"("code") ON DELETE SET NULL ON UPDATE CASCADE;
