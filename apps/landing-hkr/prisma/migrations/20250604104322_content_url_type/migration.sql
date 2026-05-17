-- CreateEnum
CREATE TYPE "ContentUrlType" AS ENUM ('internal', 'external');

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "url_type" "ContentUrlType";
