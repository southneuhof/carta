/*
  Warnings:

  - You are about to drop the column `slug` on the `ProductTranslation` table. All the data in the column will be lost.
*/

-- DropIndex
DROP INDEX IF EXISTS "ProductTranslation_language_slug_key";

-- AlterTable
ALTER TABLE "ProductTranslation" DROP COLUMN "slug";
