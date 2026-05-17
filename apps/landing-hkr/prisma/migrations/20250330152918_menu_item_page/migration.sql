/*
  Warnings:

  - You are about to drop the column `page_id` on the `MenuItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_page_id_fkey";

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "page_id";

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "menu_item_id" TEXT;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
