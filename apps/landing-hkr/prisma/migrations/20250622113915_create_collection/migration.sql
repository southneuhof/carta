-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "data" JSONB[] DEFAULT ARRAY[]::JSONB[],

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);
