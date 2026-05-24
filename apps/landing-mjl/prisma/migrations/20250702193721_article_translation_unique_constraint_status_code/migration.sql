/*
  Warnings:

  - A unique constraint covering the columns `[language,slug,status_code]` on the table `ArticleTranslation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ArticleTranslation_language_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_language_slug_status_code_key" ON "ArticleTranslation"("language", "slug", "status_code");
