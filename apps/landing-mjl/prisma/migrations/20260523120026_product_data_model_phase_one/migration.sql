-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategoryTranslation" (
    "id" TEXT NOT NULL,
    "product_category_id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProductCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "product_category_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "images" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategoryTranslation_product_category_id_language_key" ON "ProductCategoryTranslation"("product_category_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_product_id_language_key" ON "ProductTranslation"("product_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_language_slug_key" ON "ProductTranslation"("language", "slug");

-- AddForeignKey
ALTER TABLE "ProductCategoryTranslation" ADD CONSTRAINT "ProductCategoryTranslation_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
