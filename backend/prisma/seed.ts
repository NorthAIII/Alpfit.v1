// TASK-2.01 — Çekirdek egzersiz kütüphanesi seed (20 placeholder egzersiz).
// Yakın 5'te gerçek 50 egzersiz + video URL'leri eklenir.
// İdempotent: mevcut çekirdek egzersizler varsa atlanır.
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg(process.env['DATABASE_URL'] ?? '');
const prisma = new PrismaClient({ adapter });

const CORE_EXERCISES = [
  { name: 'Squat', muscleGroup: 'Bacak' },
  { name: 'Ölü Kaldırış', muscleGroup: 'Arka Zincir' },
  { name: 'Göğüs Presi (Banka)', muscleGroup: 'Göğüs' },
  { name: 'Barfiks', muscleGroup: 'Sırt' },
  { name: 'Omuz Presi', muscleGroup: 'Omuz' },
  { name: 'Lat Çekiş', muscleGroup: 'Sırt' },
  { name: 'Rowing (Barbell)', muscleGroup: 'Sırt' },
  { name: 'Leg Press', muscleGroup: 'Bacak' },
  { name: 'Pec Fly (Kelebek)', muscleGroup: 'Göğüs' },
  { name: 'Triceps Press (Kablo)', muscleGroup: 'Kol' },
  { name: 'Biceps Curl (Barbell)', muscleGroup: 'Kol' },
  { name: 'Plank', muscleGroup: 'Karın' },
  { name: 'Crunch', muscleGroup: 'Karın' },
  { name: 'Hip Thrust', muscleGroup: 'Kalça' },
  { name: 'Lunge', muscleGroup: 'Bacak' },
  { name: 'Kablo Çekiş (Karın)', muscleGroup: 'Karın' },
  { name: 'Dumbbell Omuz Presi', muscleGroup: 'Omuz' },
  { name: 'Leg Curl', muscleGroup: 'Bacak' },
  { name: 'Leg Extension', muscleGroup: 'Bacak' },
  { name: 'Calf Raise', muscleGroup: 'Bacak' },
] as const;

async function main() {
  const existing = await prisma.exercise.count({ where: { isCustom: false } });
  if (existing > 0) {
    console.log(`Çekirdek egzersizler zaten mevcut (${existing} kayıt), atlanıyor.`);
    return;
  }

  const result = await prisma.exercise.createMany({
    data: CORE_EXERCISES.map((ex) => ({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      videoUrl: null,
      isCustom: false,
      createdById: null,
    })),
  });

  console.log(`✅ ${result.count} çekirdek egzersiz eklendi.`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
