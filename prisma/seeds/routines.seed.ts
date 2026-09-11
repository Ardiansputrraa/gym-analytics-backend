import { PrismaClient } from '@prisma/client';

interface RoutineSeedItem {
  name: string;
  description: string;
  category: string;
  exerciseNames: {
    name: string;
    orderIndex: number;
    targetSets: number;
    targetReps: number;
    targetRestSeconds: number;
  }[];
}

const PRESET_ROUTINES: RoutineSeedItem[] = [
  {
    name: 'Push Day (Dada, Bahu, Triceps)',
    description: 'Fokus gerakan mendorong untuk otot dada, bahu depan/samping, dan triceps.',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Barbell Bench Press', orderIndex: 1, targetSets: 4, targetReps: 8, targetRestSeconds: 120 },
      { name: 'Incline Dumbbell Press', orderIndex: 2, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Dumbbell Shoulder Overhead Press', orderIndex: 3, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Dumbbell Lateral Raise', orderIndex: 4, targetSets: 4, targetReps: 12, targetRestSeconds: 60 },
      { name: 'Tricep Rope Pushdown', orderIndex: 5, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
    ],
  },
  {
    name: 'Pull Day (Punggung, Biceps)',
    description: 'Fokus gerakan menarik untuk otot punggung atas, lats, traps, dan biceps.',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Lat Pulldown', orderIndex: 1, targetSets: 4, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Barbell Bent-Over Row', orderIndex: 2, targetSets: 4, targetReps: 8, targetRestSeconds: 120 },
      { name: 'Seated Cable Row', orderIndex: 3, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Face Pull', orderIndex: 4, targetSets: 3, targetReps: 15, targetRestSeconds: 60 },
      { name: 'Dumbbell Bicep Curl', orderIndex: 5, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
    ],
  },
  {
    name: 'Leg Day (Kaki, Betis & Perut)',
    description: 'Latihan menyeluruh untuk paha depan (quadriceps), paha belakang, dan otot betis.',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Barbell Back Squat', orderIndex: 1, targetSets: 4, targetReps: 8, targetRestSeconds: 120 },
      { name: 'Leg Press Machine', orderIndex: 2, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Leg Extension Machine', orderIndex: 3, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
      { name: 'Lying Leg Curl Machine', orderIndex: 4, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
      { name: 'Standing Calf Raise', orderIndex: 5, targetSets: 4, targetReps: 15, targetRestSeconds: 60 },
    ],
  },
  {
    name: 'Lower Body Focus (Kaki, Glutes & Hamstrings)',
    description: 'Kombinasi fokus rantai posterior dan paha untuk penguatan lower body.',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Barbell Romanian Deadlift (RDL)', orderIndex: 1, targetSets: 4, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Dumbbell Walking Lunge', orderIndex: 2, targetSets: 3, targetReps: 12, targetRestSeconds: 90 },
      { name: 'Leg Press Machine', orderIndex: 3, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Lying Leg Curl Machine', orderIndex: 4, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
    ],
  },
  {
    name: 'Arm Day (Biceps & Triceps)',
    description: 'Program isolasi hipertrofi intensif untuk lingkar lengan (biceps & triceps).',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Barbell Bicep Curl', orderIndex: 1, targetSets: 4, targetReps: 10, targetRestSeconds: 60 },
      { name: 'Tricep Rope Pushdown', orderIndex: 2, targetSets: 4, targetReps: 12, targetRestSeconds: 60 },
      { name: 'Dumbbell Hammer Curl', orderIndex: 3, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
      { name: 'Cable Rope Overhead Tricep Extension', orderIndex: 4, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
    ],
  },
  {
    name: 'Upper Body Focus (Dada, Punggung, Bahu)',
    description: 'Gabungan gerakan majemuk untuk seluruh torso tubuh bagian atas.',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Barbell Bench Press', orderIndex: 1, targetSets: 3, targetReps: 8, targetRestSeconds: 90 },
      { name: 'Lat Pulldown', orderIndex: 2, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Dumbbell Shoulder Overhead Press', orderIndex: 3, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Seated Cable Row', orderIndex: 4, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
    ],
  },
  {
    name: 'Core & Abs Focus (Perut & Pinggang)',
    description: 'Penguatan otot inti, kestabilan lumbar, dan pembentukan perut sixpack.',
    category: 'STRENGTH',
    exerciseNames: [
      { name: 'Hanging Leg Raise', orderIndex: 1, targetSets: 3, targetReps: 15, targetRestSeconds: 60 },
      { name: 'Plank Bodyweight', orderIndex: 2, targetSets: 3, targetReps: 60, targetRestSeconds: 60 },
      { name: 'Cable Rope Ab Crunch', orderIndex: 3, targetSets: 3, targetReps: 15, targetRestSeconds: 60 },
      { name: 'Ab Wheel Rollout', orderIndex: 4, targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
    ],
  },
  {
    name: 'Full Body Workout',
    description: 'Kombinasi efisien compound lift seluruh tubuh untuk pembakaran kalori maksimal.',
    category: 'FULL_BODY',
    exerciseNames: [
      { name: 'Barbell Back Squat', orderIndex: 1, targetSets: 3, targetReps: 8, targetRestSeconds: 120 },
      { name: 'Barbell Bench Press', orderIndex: 2, targetSets: 3, targetReps: 8, targetRestSeconds: 90 },
      { name: 'Lat Pulldown', orderIndex: 3, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Dumbbell Shoulder Overhead Press', orderIndex: 4, targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
      { name: 'Plank Bodyweight', orderIndex: 5, targetSets: 3, targetReps: 60, targetRestSeconds: 60 },
    ],
  },
];

export async function seedRoutineTemplates(prisma: PrismaClient) {
  console.log('🌱 Seeding preset Routine Templates...');

  // Fetch all exercises to map names to IDs
  const allExercises = await prisma.exercise.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
  });

  const exerciseMap = new Map<string, string>();
  for (const ex of allExercises) {
    exerciseMap.set(ex.name.toLowerCase().trim(), ex.id);
  }

  for (const routine of PRESET_ROUTINES) {
    let template = await prisma.routineTemplate.findFirst({
      where: { name: routine.name, isDeleted: false },
    });

    if (!template) {
      template = await prisma.routineTemplate.create({
        data: {
          name: routine.name,
          description: routine.description,
          category: routine.category,
        },
      });
      console.log(`  + Created Routine Template: ${routine.name}`);
    }

    // Seed exercises for template
    for (const exItem of routine.exerciseNames) {
      // Find matching exercise ID (exact or case-insensitive partial match)
      const exKey = exItem.name.toLowerCase().trim();
      let exerciseId = exerciseMap.get(exKey);

      if (!exerciseId) {
        // Fallback fuzzy search
        for (const [name, id] of exerciseMap.entries()) {
          if (name.includes(exKey) || exKey.includes(name)) {
            exerciseId = id;
            break;
          }
        }
      }

      if (exerciseId) {
        const existingRte = await prisma.routineTemplateExercise.findFirst({
          where: {
            routineTemplateId: template.id,
            exerciseId: exerciseId,
            isDeleted: false,
          },
        });

        if (!existingRte) {
          await prisma.routineTemplateExercise.create({
            data: {
              routineTemplateId: template.id,
              exerciseId: exerciseId,
              orderIndex: exItem.orderIndex,
              targetSets: exItem.targetSets,
              targetReps: exItem.targetReps,
              targetRestSeconds: exItem.targetRestSeconds,
            },
          });
        }
      }
    }
  }

  console.log(`✅ Seeded ${PRESET_ROUTINES.length} routine templates.`);
}
