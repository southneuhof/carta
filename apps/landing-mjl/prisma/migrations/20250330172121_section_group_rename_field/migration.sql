/*
  Warnings:

  - You are about to drop the column `structureDefinition` on the `SectionGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SectionGroup" DROP COLUMN "structureDefinition",
ADD COLUMN     "sectionGroupStructure" JSONB NOT NULL DEFAULT '[]';
