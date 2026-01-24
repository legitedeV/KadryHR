-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "employeesCount" TEXT,
    "message" TEXT,
    "source" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
