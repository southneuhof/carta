-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "collection" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "meta" JSONB NOT NULL DEFAULT '{}';
