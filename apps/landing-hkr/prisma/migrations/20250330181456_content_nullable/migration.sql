/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "imageUrl",
ADD COLUMN     "media" TEXT,
ALTER COLUMN "title" DROP NOT NULL;
