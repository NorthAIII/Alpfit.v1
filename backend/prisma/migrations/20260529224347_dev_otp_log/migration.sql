-- CreateTable
CREATE TABLE "DevOtpLog" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ttlSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "DevOtpLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevOtpLog_phoneE164_idx" ON "DevOtpLog"("phoneE164");

-- CreateIndex
CREATE INDEX "DevOtpLog_createdAt_idx" ON "DevOtpLog"("createdAt");
