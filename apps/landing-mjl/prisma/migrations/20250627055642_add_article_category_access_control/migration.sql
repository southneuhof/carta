-- CreateTable
CREATE TABLE "_ArticleCategoryAccess" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArticleCategoryAccess_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArticleCategoryAccess_B_index" ON "_ArticleCategoryAccess"("B");

-- AddForeignKey
ALTER TABLE "_ArticleCategoryAccess" ADD CONSTRAINT "_ArticleCategoryAccess_A_fkey" FOREIGN KEY ("A") REFERENCES "ArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCategoryAccess" ADD CONSTRAINT "_ArticleCategoryAccess_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
