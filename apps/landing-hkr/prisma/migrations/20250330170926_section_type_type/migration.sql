-- CreateEnum
CREATE TYPE "SectionTypeType" AS ENUM ('parent', 'child');

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "meta" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "SectionType" ADD COLUMN     "category" "SectionTypeType" NOT NULL DEFAULT 'parent';
