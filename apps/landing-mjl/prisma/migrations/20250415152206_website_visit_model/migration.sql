-- CreateTable
CREATE TABLE "WebsiteVisit" (
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteVisit_pkey" PRIMARY KEY ("id")
);
