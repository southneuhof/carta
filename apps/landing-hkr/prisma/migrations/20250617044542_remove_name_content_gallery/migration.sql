/*
  Warnings:

  - You are about to drop the column `name` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Gallery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Gallery" DROP COLUMN "name";
