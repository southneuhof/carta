-- CreateTable
CREATE TABLE "ImageManifest" (
    "id" TEXT NOT NULL,
    "original_path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "aspect_ratio" DOUBLE PRECISION NOT NULL,
    "format" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "placeholder" TEXT NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageManifest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageManifest_original_path_key" ON "ImageManifest"("original_path");
