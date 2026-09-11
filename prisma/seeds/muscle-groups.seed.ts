import { PrismaClient } from '@prisma/client';

export interface MuscleGroupSeedData {
  name: string;
  displayName: string;
  description?: string;
  orderIndex: number;
}

export const MUSCLE_GROUPS_DATA: MuscleGroupSeedData[] = [
  { name: 'CHEST', displayName: 'Dada', description: 'Otot dada (Pectoralis Major & Minor)', orderIndex: 1 },
  { name: 'BACK', displayName: 'Punggung', description: 'Otot punggung (Latissimus Dorsi, Trapezius, Rhomboids, Lower Back)', orderIndex: 2 },
  { name: 'LEGS', displayName: 'Kaki', description: 'Otot kaki bawah & atas (Quadriceps, Hamstrings, Glutes, Calves)', orderIndex: 3 },
  { name: 'SHOULDERS', displayName: 'Bahu', description: 'Otot bahu (Anterior, Lateral, Posterior Deltoids)', orderIndex: 4 },
  { name: 'BICEPS', displayName: 'Biceps', description: 'Otot lengan depan (Biceps Brachii, Brachialis)', orderIndex: 5 },
  { name: 'TRICEPS', displayName: 'Triceps', description: 'Otot lengan belakang (Triceps Brachii)', orderIndex: 6 },
  { name: 'CORE', displayName: 'Perut / Core', description: 'Otot inti & perut (Abs, Obliques, Transverse Abdominis)', orderIndex: 7 },
  { name: 'CARDIO', displayName: 'Kardio', description: 'Latihan daya tahan jantung, paru-paru & pembakaran kalori', orderIndex: 8 },
  { name: 'FULL_BODY', displayName: 'Full Body', description: 'Gerakan gabungan seluruh tubuh (Compound full body)', orderIndex: 9 },
];

export async function seedMuscleGroups(prisma: PrismaClient): Promise<Map<string, string>> {
  console.log('🌱 Seeding master muscle groups...');
  const muscleGroupMap = new Map<string, string>();

  for (const item of MUSCLE_GROUPS_DATA) {
    const existing = await prisma.muscleGroup.findUnique({
      where: { name: item.name },
    });

    if (existing) {
      const updated = await prisma.muscleGroup.update({
        where: { id: existing.id },
        data: {
          displayName: item.displayName,
          description: item.description,
          orderIndex: item.orderIndex,
          isDeleted: false,
        },
      });
      muscleGroupMap.set(item.name, updated.id);
    } else {
      const created = await prisma.muscleGroup.create({
        data: {
          name: item.name,
          displayName: item.displayName,
          description: item.description,
          orderIndex: item.orderIndex,
        },
      });
      muscleGroupMap.set(item.name, created.id);
    }
  }

  console.log(`✅ Seeded ${muscleGroupMap.size} muscle groups.`);
  return muscleGroupMap;
}
