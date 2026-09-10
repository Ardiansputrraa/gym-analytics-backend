import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedMuscleGroups } from './seeds/muscle-groups.seed';
import { seedExercises } from './seeds/exercises.seed';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://gym_admin:GymAn4lytics_2026_9xP7_vK2_rL8_T5@127.0.0.1:55432/gym_analytics?schema=identity';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting database seeding...');
  const startTime = Date.now();

  try {
    // 1. Muscle Groups Master Data
    const muscleGroupMap = await seedMuscleGroups(prisma);

    // 2. Exercises Master Library (53 items)
    await seedExercises(prisma, muscleGroupMap);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Database seeding completed successfully in ${duration}s!`);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
