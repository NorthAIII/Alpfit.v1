-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('kvkk_aydinlatma', 'saglik_verisi', 'pazarlama_iletisim');

-- CreateEnum
CREATE TYPE "ConsentEventType" AS ENUM ('granted', 'revoked', 'auto_revoked');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('user_created', 'user_login', 'user_logout', 'user_logout_all', 'otp_sent', 'otp_verified', 'otp_verify_failed', 'consent_granted', 'consent_revoked', 'invitation_created', 'invitation_accepted', 'member_removed', 'refresh_rotated', 'refresh_replay_detected', 'refresh_expired', 'retention_purge');

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "eventType" "ConsentEventType" NOT NULL,
    "textVersion" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userIdHash" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_consentType_idx" ON "ConsentRecord"("userId", "consentType");

-- CreateIndex
CREATE INDEX "ConsentRecord_occurredAt_idx" ON "ConsentRecord"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_userIdHash_idx" ON "AuditLog"("userIdHash");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
