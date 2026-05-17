/*
  Warnings:

  - The primary key for the `Collection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Collection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Collection_pkey" PRIMARY KEY ("code");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_code_key" ON "Collection"("code");
