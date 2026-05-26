-- CreateTable
CREATE TABLE "JobCategory" (
    "id" TEXT NOT NULL,
    "form_type_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCategoryTranslation" (
    "id" TEXT NOT NULL,
    "job_category_id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "JobCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "job_category_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTranslation" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "minimum_education" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "qualification" TEXT,

    CONSTRAINT "JobTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobCategoryTranslation_job_category_id_language_key" ON "JobCategoryTranslation"("job_category_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "JobTranslation_job_id_language_key" ON "JobTranslation"("job_id", "language");

-- AddForeignKey
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_form_type_id_fkey" FOREIGN KEY ("form_type_id") REFERENCES "FormType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCategoryTranslation" ADD CONSTRAINT "JobCategoryTranslation_job_category_id_fkey" FOREIGN KEY ("job_category_id") REFERENCES "JobCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_job_category_id_fkey" FOREIGN KEY ("job_category_id") REFERENCES "JobCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTranslation" ADD CONSTRAINT "JobTranslation_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
