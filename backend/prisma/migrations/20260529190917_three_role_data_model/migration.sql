-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'trainer', 'gym_owner');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "gymName" TEXT,
    "certificateNote" TEXT,
    "kvkkConsentAt" TIMESTAMP(3),
    "healthConsentAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "retentionDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerMember" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "TrainerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymOwnerTrainer" (
    "id" TEXT NOT NULL,
    "gymOwnerId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "GymOwnerTrainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "TrainerMember_trainerId_idx" ON "TrainerMember"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerMember_memberId_idx" ON "TrainerMember"("memberId");

-- CreateIndex
CREATE INDEX "TrainerMember_memberId_endedAt_idx" ON "TrainerMember"("memberId", "endedAt");

-- CreateIndex
CREATE INDEX "GymOwnerTrainer_gymOwnerId_idx" ON "GymOwnerTrainer"("gymOwnerId");

-- CreateIndex
CREATE INDEX "GymOwnerTrainer_trainerId_idx" ON "GymOwnerTrainer"("trainerId");

-- CreateIndex
CREATE INDEX "GymOwnerTrainer_trainerId_endedAt_idx" ON "GymOwnerTrainer"("trainerId", "endedAt");

-- AddForeignKey
ALTER TABLE "TrainerMember" ADD CONSTRAINT "TrainerMember_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerMember" ADD CONSTRAINT "TrainerMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymOwnerTrainer" ADD CONSTRAINT "GymOwnerTrainer_gymOwnerId_fkey" FOREIGN KEY ("gymOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymOwnerTrainer" ADD CONSTRAINT "GymOwnerTrainer_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================================
-- TASK-1.13 — Aktif ilişki tekliği (partial unique index, raw SQL)
-- =====================================================================
-- Prisma DSL partial unique index üretmediği için PostgreSQL'in `WHERE`
-- klozlu unique index'i raw SQL olarak eklenir. NULL'lar PostgreSQL'de
-- "her satır farklı NULL" gibi davranır; bu yüzden `@@unique([..., endedAt])`
-- yaklaşımı çoklu aktif (endedAt IS NULL) satırları engelleyemez. Partial
-- index `endedAt IS NULL` koşulu yalnızca aktif satırları kapsar ve her
-- (memberId / trainerId) için tek aktif satıra izin verir.

-- Bir üye herhangi bir anda yalnızca BİR aktif PT'ye bağlı olabilir (v1).
CREATE UNIQUE INDEX "TrainerMember_memberId_active_unique"
  ON "TrainerMember" ("memberId")
  WHERE "endedAt" IS NULL;

-- Bir PT herhangi bir anda yalnızca BİR gym owner'a bağlı olabilir (v1.5+).
CREATE UNIQUE INDEX "GymOwnerTrainer_trainerId_active_unique"
  ON "GymOwnerTrainer" ("trainerId")
  WHERE "endedAt" IS NULL;
