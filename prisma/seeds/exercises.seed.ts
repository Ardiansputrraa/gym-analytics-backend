import { PrismaClient, EquipmentCategory, ExerciseType } from '@prisma/client';

export interface ExerciseSeedItem {
  name: string;
  muscleGroupName: string; // matches MuscleGroup.name
  equipment: EquipmentCategory;
  exerciseType?: ExerciseType;
  description?: string;
}

export const EXERCISES_DATA: ExerciseSeedItem[] = [
  // CHEST (DADA)
  { name: 'Barbell Bench Press', muscleGroupName: 'CHEST', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Gerakan compound utama untuk membangun ketebalan dan kekuatan otot dada.' },
  { name: 'Incline Dumbbell Press', muscleGroupName: 'CHEST', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Membentuk dan mempertegas otot dada bagian atas (Upper Chest).' },
  { name: 'Flat Dumbbell Press', muscleGroupName: 'CHEST', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Melatih otot dada tengah dengan rentang gerak (ROM) maksimal.' },
  { name: 'Incline Barbell Bench Press', muscleGroupName: 'CHEST', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Bench press nanjak barbell untuk fokus dada atas.' },
  { name: 'Cable Chest Fly (High to Low)', muscleGroupName: 'CHEST', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Kontraksi isolasi dada bawah dan tengah dengan tegangan konstan.' },
  { name: 'Pec Deck / Chest Fly Machine', muscleGroupName: 'CHEST', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Mesin isolasi otot dada aman dan stabil.' },
  { name: 'Smith Machine Incline Press', muscleGroupName: 'CHEST', equipment: 'SMITH', exerciseType: 'STRENGTH', description: 'Incline press dengan jalur terpandu stabil.' },
  { name: 'Chest Dips (Bodyweight / Weighted)', muscleGroupName: 'CHEST', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Dips condong ke depan untuk dada bawah dan triceps.' },
  { name: 'Standard Push-Ups', muscleGroupName: 'CHEST', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Push-up standar melatih dada, core, dan bahu depan.' },

  // BACK (PUNGGUNG)
  { name: 'Wide-Grip Lat Pulldown', muscleGroupName: 'BACK', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Membangun lebar sayap punggung (Latissimus Dorsi V-Taper).' },
  { name: 'Seated Cable Row', muscleGroupName: 'BACK', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Menebalkan punggung tengah dan rhomboids.' },
  { name: 'Barbell Bent-Over Row', muscleGroupName: 'BACK', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Gerakan compound berat untuk ketebalan seluruh punggung.' },
  { name: 'T-Bar Row Machine', muscleGroupName: 'BACK', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Rowing dengan tumpuan dada untuk isolasi latissimus dorsi.' },
  { name: 'Pull-Ups / Chin-Ups', muscleGroupName: 'BACK', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Gerakan pull-up bodyweight pembentuk V-Taper punggung.' },
  { name: 'One-Arm Dumbbell Row', muscleGroupName: 'BACK', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Rowing unilateral satu tangan untuk keseimbangan otot punggung.' },
  { name: 'Conventional Barbell Deadlift', muscleGroupName: 'BACK', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Raja gerakan compound posterior chain dan punggung bawah.' },
  { name: 'Back Hyperextension (Lower Back)', muscleGroupName: 'BACK', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Memperkuat pinggang bawah (erector spinae) dan glutes.' },

  // BICEPS (LENGAN DEPAN)
  { name: 'Standing Dumbbell Bicep Curl', muscleGroupName: 'BICEPS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Curl dumbbell berdiri melatih puncak biceps (Biceps Brachii).' },
  { name: 'Incline Dumbbell Bicep Curl', muscleGroupName: 'BICEPS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Regangan maksimal pada long head biceps.' },
  { name: 'Dumbbell Hammer Curl', muscleGroupName: 'BICEPS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Menebalkan lengan dan melatih brachialis serta brachioradialis.' },
  { name: 'Cable Rope Hammer Curl', muscleGroupName: 'BICEPS', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Hammer curl kabel dengan tegangan continuous.' },
  { name: 'EZ-Bar / Straight Barbell Curl', muscleGroupName: 'BICEPS', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Bicep curl barbell beban berat untuk massa lengan.' },
  { name: 'Preacher Curl (Machine / EZ-Bar)', muscleGroupName: 'BICEPS', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Isolasi murni biceps tanpa momentum badan.' },
  { name: 'Concentration Dumbbell Curl', muscleGroupName: 'BICEPS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Curl fokus satu tangan duduk untuk puncak biceps.' },

  // TRICEPS (LENGAN BELAKANG)
  { name: 'Cable Tricep Pushdown (Straight/V-Bar)', muscleGroupName: 'TRICEPS', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Pushdown kabel melatih lateral dan medial head triceps.' },
  { name: 'Cable Rope Overhead Tricep Extension', muscleGroupName: 'TRICEPS', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Regangan long head triceps posisi overhead.' },
  { name: 'EZ-Bar Skull Crusher (Lying)', muscleGroupName: 'TRICEPS', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Gerakan isolasi triceps paling efektif saat berbaring.' },
  { name: 'Seated Dumbbell Overhead Tricep Extension', muscleGroupName: 'TRICEPS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Extension dumbbell dua tangan di belakang kepala.' },
  { name: 'Tricep Bench Dips', muscleGroupName: 'TRICEPS', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Dips di bangku untuk membakar triceps.' },

  // SHOULDERS (BAHU)
  { name: 'Seated Dumbbell Shoulder Press', muscleGroupName: 'SHOULDERS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Press dumbbell duduk melatih kekuatan bahu depan dan samping.' },
  { name: 'Standing Overhead Barbell Press (OHP)', muscleGroupName: 'SHOULDERS', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Compound military press bahu berdiri menguatkan core.' },
  { name: 'Dumbbell Lateral Raise (Side Delts)', muscleGroupName: 'SHOULDERS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Membangun bahu samping 3D (Lateral Deltoids).' },
  { name: 'Cable Lateral Raise', muscleGroupName: 'SHOULDERS', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Lateral raise kabel dengan tegangan di awal gerakan.' },
  { name: 'Cable Face Pull (Rear Delts & Traps)', muscleGroupName: 'SHOULDERS', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Melatih bahu belakang dan postur punggung atas.' },
  { name: 'Reverse Pec Deck (Rear Delt Fly)', muscleGroupName: 'SHOULDERS', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Fly mesin terbalik untuk posterior deltoid.' },
  { name: 'Dumbbell Front Raise', muscleGroupName: 'SHOULDERS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Angkat beban lurus ke depan melatih anterior deltoids.' },

  // LEGS (KAKI & BETIS)
  { name: 'Barbell Back Squat', muscleGroupName: 'LEGS', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'Raja latihan compound kaki (Quadriceps, Glutes, Hamstrings).' },
  { name: 'Incline 45° Leg Press Machine', muscleGroupName: 'LEGS', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Mendorong beban berat kaki tanpa beban di tulang belakang.' },
  { name: 'Leg Extension Machine (Quads)', muscleGroupName: 'LEGS', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Isolasi quadriceps untuk definisi paha depan.' },
  { name: 'Lying Leg Curl Machine (Hamstrings)', muscleGroupName: 'LEGS', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Isolasi hamstrings saat telungkup.' },
  { name: 'Romanian Deadlift (RDL)', muscleGroupName: 'LEGS', equipment: 'BARBELL', exerciseType: 'STRENGTH', description: 'RDL barbell melatih fleksibilitas dan kekuatan hamstrings & glutes.' },
  { name: 'Walking Dumbbell Lunges', muscleGroupName: 'LEGS', equipment: 'DUMBBELL', exerciseType: 'STRENGTH', description: 'Lunges jalan membentuk glutes, paha, dan keseimbangan kaki.' },
  { name: 'Standing / Seated Calf Raise', muscleGroupName: 'LEGS', equipment: 'MACHINE', exerciseType: 'STRENGTH', description: 'Melatih otot betis (Gastrocnemius & Soleus).' },
  { name: 'Smith Machine Squat', muscleGroupName: 'LEGS', equipment: 'SMITH', exerciseType: 'STRENGTH', description: 'Squat smith machine stabil untuk isolasi quad dominan.' },

  // CORE (PERUT & PINGGANG)
  { name: 'Hanging Leg Raise / Knee Raise', muscleGroupName: 'CORE', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Menggantung melatih perut bawah (Lower Abs) intensif.' },
  { name: 'Kneeling Cable Crunch', muscleGroupName: 'CORE', equipment: 'CABLE', exerciseType: 'STRENGTH', description: 'Crunch kabel berlutut dengan beban progresif.' },
  { name: 'Core Plank Hold', muscleGroupName: 'CORE', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT', description: 'Plank isometrik untuk stabilitas inti tubuh.' },
  { name: 'Ab Wheel Rollout', muscleGroupName: 'CORE', equipment: 'OTHER', exerciseType: 'BODYWEIGHT', description: 'Roda ab rollout melatih kekuatan inti menyeluruh.' },

  // CARDIO (KARDIO, TREADMILL & ENDURANCE)
  {
    name: 'Treadmill Incline Fat Burn (12-3-30 Walk)',
    muscleGroupName: 'CARDIO',
    equipment: 'TREADMILL',
    exerciseType: 'CARDIO_TREADMILL',
    description: 'Jalan nanjak konsisten (Incline 10-12%, Speed 4.8 km/h, 30 menit) membakar lemak maksimal tanpa membebani lutut.',
  },
  {
    name: 'Treadmill Running / Jogging',
    muscleGroupName: 'CARDIO',
    equipment: 'TREADMILL',
    exerciseType: 'CARDIO_TREADMILL',
    description: 'Lari stabil di atas treadmill dengan pengaturan kecepatan dan kemiringan.',
  },
  {
    name: 'Treadmill HIIT Sprint Intervals',
    muscleGroupName: 'CARDIO',
    equipment: 'TREADMILL',
    exerciseType: 'CARDIO_TREADMILL',
    description: 'Sesi interval lari sprint cepat diselingi pemulihan jalan santai.',
  },
  {
    name: 'StairMaster / StepMill (Tangga Nanjak)',
    muscleGroupName: 'CARDIO',
    equipment: 'STAIR_MASTER',
    exerciseType: 'CARDIO_GENERIC',
    description: 'Mesin tangga berjalan melatih glutes, paha, dan sistem kardiovaskular.',
  },
  {
    name: 'Stationary Spin Bike (Sepeda Statis)',
    muscleGroupName: 'CARDIO',
    equipment: 'STATIONARY_BIKE',
    exerciseType: 'CARDIO_GENERIC',
    description: 'Gowes sepeda gym dengan resistensi terukur.',
  },
];

export async function seedExercises(
  prisma: PrismaClient,
  muscleGroupMap: Map<string, string>,
): Promise<number> {
  console.log('🌱 Seeding master gym exercises...');
  let count = 0;

  for (const item of EXERCISES_DATA) {
    const muscleGroupId = muscleGroupMap.get(item.muscleGroupName);
    if (!muscleGroupId) {
      console.warn(`⚠️ Muscle group "${item.muscleGroupName}" not found in map, skipping "${item.name}".`);
      continue;
    }

    const existing = await prisma.exercise.findFirst({
      where: {
        name: item.name,
        userId: null,
      },
    });

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          equipment: item.equipment,
          exerciseType: item.exerciseType ?? 'STRENGTH',
          primaryMuscleGroupId: muscleGroupId,
          isCustom: false,
          isActive: true,
          isDeleted: false,
        },
      });
    } else {
      await prisma.exercise.create({
        data: {
          name: item.name,
          description: item.description,
          equipment: item.equipment,
          exerciseType: item.exerciseType ?? 'STRENGTH',
          primaryMuscleGroupId: muscleGroupId,
          isCustom: false,
          isActive: true,
        },
      });
    }
    count++;
  }

  console.log(`✅ Seeded ${count} master gym exercises.`);
  return count;
}
