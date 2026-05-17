/*
  Warnings:

  - You are about to drop the column `success_message` on the `FormType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FormType" DROP COLUMN "success_message";

-- CreateTable
CREATE TABLE "_MenuItemAccess" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MenuItemAccess_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MenuItemAccess_B_index" ON "_MenuItemAccess"("B");

-- AddForeignKey
ALTER TABLE "_MenuItemAccess" ADD CONSTRAINT "_MenuItemAccess_A_fkey" FOREIGN KEY ("A") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemAccess" ADD CONSTRAINT "_MenuItemAccess_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
