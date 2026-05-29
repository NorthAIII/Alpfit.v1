/**
 * TASK-1.13 — 3 rol veri modeli integration testleri.
 *
 * Her test suite kendi izole Postgres veritabanı kullanır (test/db.ts) —
 * migration `prisma migrate deploy` ile uygulanır, raw partial unique
 * index'ler de bu yolla deploy edilir. Bu sayede DB-level invariant'lar
 * gerçek bir Postgres üzerinde doğrulanır.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { Role } from '../generated/prisma/enums.js';

import { ActiveTrainerRelationExistsError, assertSingleActivePtForMember } from './relations.js';

describe("TASK-1.13 — 3 rol veri modeli + ilişki invariant'ları", () => {
  let testDb: TestDatabase;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    prisma = createPrismaClient(testDb.databaseUrl);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    // İlişki tablolarını + User'ı her test başında temizle (FK sırasına dikkat).
    await prisma.trainerMember.deleteMany();
    await prisma.gymOwnerTrainer.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('User — phoneE164 unique global', () => {
    it('aynı phoneE164 ile ikinci create unique constraint hatası verir', async () => {
      await prisma.user.create({
        data: {
          phoneE164: '+905551234567',
          role: Role.member,
          firstName: 'Ayşe',
          lastName: 'Yılmaz',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            phoneE164: '+905551234567',
            role: Role.trainer,
            firstName: 'Mehmet',
            lastName: 'Demir',
          },
        }),
      ).rejects.toThrow(/Unique constraint|phoneE164/i);
    });

    it('gym_owner rolü DB seviyesinde izinli (UI engellemesi sonraki katmanda)', async () => {
      const user = await prisma.user.create({
        data: {
          phoneE164: '+905559876543',
          role: Role.gym_owner,
          firstName: 'Hasan',
          lastName: 'Öztürk',
          gymName: 'Şahin Spor Salonu',
        },
      });

      expect(user.role).toBe(Role.gym_owner);
      expect(user.gymName).toBe('Şahin Spor Salonu');
    });
  });

  describe('TrainerMember — aktif PT-üye tekliği (partial unique index)', () => {
    it('bir üye için iki aktif ilişki (endedAt: null) DB tarafından reddedilir', async () => {
      const trainer1 = await prisma.user.create({
        data: {
          phoneE164: '+905551111111',
          role: Role.trainer,
          firstName: 'PT1',
          lastName: 'Bir',
        },
      });
      const trainer2 = await prisma.user.create({
        data: {
          phoneE164: '+905552222222',
          role: Role.trainer,
          firstName: 'PT2',
          lastName: 'İki',
        },
      });
      const member = await prisma.user.create({
        data: {
          phoneE164: '+905553333333',
          role: Role.member,
          firstName: 'Üye',
          lastName: 'Bir',
        },
      });

      await prisma.trainerMember.create({
        data: { trainerId: trainer1.id, memberId: member.id },
      });

      await expect(
        prisma.trainerMember.create({
          data: { trainerId: trainer2.id, memberId: member.id },
        }),
      ).rejects.toThrow(/Unique constraint|TrainerMember_memberId_active_unique/i);
    });

    it('aktif ilişki sonlandırıldıktan sonra yeni PT ile aktif ilişki kurulabilir', async () => {
      const trainer1 = await prisma.user.create({
        data: {
          phoneE164: '+905554444444',
          role: Role.trainer,
          firstName: 'PT1',
          lastName: 'Bir',
        },
      });
      const trainer2 = await prisma.user.create({
        data: {
          phoneE164: '+905555555555',
          role: Role.trainer,
          firstName: 'PT2',
          lastName: 'İki',
        },
      });
      const member = await prisma.user.create({
        data: {
          phoneE164: '+905556666666',
          role: Role.member,
          firstName: 'Üye',
          lastName: 'İki',
        },
      });

      const rel1 = await prisma.trainerMember.create({
        data: { trainerId: trainer1.id, memberId: member.id },
      });

      // PT1 ilişkisini sonlandır
      await prisma.trainerMember.update({
        where: { id: rel1.id },
        data: { endedAt: new Date() },
      });

      // PT2 ile yeni aktif ilişki kurulabilmeli
      const rel2 = await prisma.trainerMember.create({
        data: { trainerId: trainer2.id, memberId: member.id },
      });

      expect(rel2.endedAt).toBeNull();
      expect(rel2.trainerId).toBe(trainer2.id);

      // Üyenin sadece bir aktif ilişkisi olduğunu doğrula
      const activeCount = await prisma.trainerMember.count({
        where: { memberId: member.id, endedAt: null },
      });
      expect(activeCount).toBe(1);
    });

    it('assertSingleActivePtForMember aktif ilişki varsa ActiveTrainerRelationExistsError fırlatır', async () => {
      const trainer = await prisma.user.create({
        data: {
          phoneE164: '+905557777777',
          role: Role.trainer,
          firstName: 'PT',
          lastName: 'Üç',
        },
      });
      const member = await prisma.user.create({
        data: {
          phoneE164: '+905558888888',
          role: Role.member,
          firstName: 'Üye',
          lastName: 'Üç',
        },
      });

      // Aktif ilişki yoksa hata yok
      await expect(assertSingleActivePtForMember(prisma, member.id)).resolves.toBeUndefined();

      await prisma.trainerMember.create({
        data: { trainerId: trainer.id, memberId: member.id },
      });

      // Şimdi aktif ilişki var → hata
      await expect(assertSingleActivePtForMember(prisma, member.id)).rejects.toBeInstanceOf(
        ActiveTrainerRelationExistsError,
      );
    });
  });

  describe('GymOwnerTrainer — v1 boş slot ama model + invariant tanımlı', () => {
    it('bir PT için iki aktif gym owner ilişkisi DB tarafından reddedilir', async () => {
      const owner1 = await prisma.user.create({
        data: {
          phoneE164: '+905550000001',
          role: Role.gym_owner,
          firstName: 'Sahip',
          lastName: 'Bir',
        },
      });
      const owner2 = await prisma.user.create({
        data: {
          phoneE164: '+905550000002',
          role: Role.gym_owner,
          firstName: 'Sahip',
          lastName: 'İki',
        },
      });
      const trainer = await prisma.user.create({
        data: {
          phoneE164: '+905550000003',
          role: Role.trainer,
          firstName: 'PT',
          lastName: 'Slot',
        },
      });

      await prisma.gymOwnerTrainer.create({
        data: { gymOwnerId: owner1.id, trainerId: trainer.id },
      });

      await expect(
        prisma.gymOwnerTrainer.create({
          data: { gymOwnerId: owner2.id, trainerId: trainer.id },
        }),
      ).rejects.toThrow(/Unique constraint|GymOwnerTrainer_trainerId_active_unique/i);
    });
  });
});
