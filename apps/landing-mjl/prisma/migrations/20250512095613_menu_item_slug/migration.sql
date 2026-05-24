/*
  Warnings:

  - You are about to drop the column `slug` on the `Page` table. All the data in the column will be lost.
  - Added the required column `slug` to the `MenuItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "slug";
