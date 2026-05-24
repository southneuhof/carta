/*
  Warnings:

  - You are about to drop the column `article_category_id` on the `Article` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_article_category_id_fkey";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "article_category_id";

-- CreateTable
CREATE TABLE "_ArticleToCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleToCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArticleToCategories_B_index" ON "_ArticleToCategories"("B");

-- AddForeignKey
ALTER TABLE "_ArticleToCategories" ADD CONSTRAINT "_ArticleToCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToCategories" ADD CONSTRAINT "_ArticleToCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "ArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
