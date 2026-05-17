/*
  Warnings:

  - You are about to drop the column `slug` on the `MenuItemTranslation` table. All the data in the column will be lost.
  - Added the required column `slug` to the `PageTranslation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItemTranslation" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "Page" ADD COLUMN "slug" TEXT NOT NULL;
