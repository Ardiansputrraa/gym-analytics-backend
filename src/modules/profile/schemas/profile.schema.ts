import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Gender } from '../../../domain/enums/gender.enum';
import { ActivityLevel } from '../../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';

export const UpsertProfileSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama lengkap wajib diisi' }).max(255).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^08\d{8,11}$/, {
      message:
        'Nomor telepon harus berupa nomor seluler Indonesia yang valid diawali dengan 08 (10-13 digit)',
    })
    .optional()
    .nullable(),
  age: z
    .number({ message: 'Usia wajib diisi' })
    .int('Usia harus berupa bilangan bulat')
    .min(10, 'Usia minimal 10 tahun')
    .max(120, 'Usia maksimal 120 tahun'),
  gender: z.nativeEnum(Gender, {
    message: 'Jenis kelamin harus MALE atau FEMALE',
  }),
  heightCm: z
    .number({ message: 'Tinggi badan wajib diisi' })
    .min(50, 'Tinggi badan minimal 50 cm')
    .max(300, 'Tinggi badan maksimal 300 cm'),
  weightKg: z
    .number({ message: 'Berat badan wajib diisi' })
    .min(20, 'Berat badan minimal 20 kg')
    .max(500, 'Berat badan maksimal 500 kg'),
  activityLevel: z
    .nativeEnum(ActivityLevel, {
      message: 'Tingkat aktivitas harus valid',
    })
    .default(ActivityLevel.SEDENTARY)
    .optional(),
  fitnessGoal: z.nativeEnum(FitnessGoal, {
    message: 'Target kebugaran wajib dipilih',
  }),
  dietPace: z.nativeEnum(DietPace).default(DietPace.STANDARD).optional(),
  checkInIntervalDays: z.number().int().min(1).max(365).default(30).optional(),
  skeletalMuscleKg: z
    .number()
    .min(0.1, { message: 'Skeletal Muscle minimal 0.1 kg' })
    .max(300, { message: 'Skeletal Muscle maksimal 300 kg' })
    .optional()
    .nullable(),
  bodyFatPct: z
    .number()
    .min(0.1, { message: 'Body Fat % minimal 0.1%' })
    .max(100, { message: 'Body Fat % maksimal 100%' })
    .optional()
    .nullable(),
  bodyFatKg: z
    .number()
    .min(0.1, { message: 'Body Fat minimal 0.1 kg' })
    .max(300, { message: 'Body Fat maksimal 300 kg' })
    .optional()
    .nullable(),
  fatFreeMassKg: z
    .number()
    .min(0.1, { message: 'Massa Bebas Lemak minimal 0.1 kg' })
    .max(300, { message: 'Massa Bebas Lemak maksimal 300 kg' })
    .optional()
    .nullable(),
  waterContentKg: z
    .number()
    .min(0.1, { message: 'Kandungan Air minimal 0.1 kg' })
    .max(300, { message: 'Kandungan Air maksimal 300 kg' })
    .optional()
    .nullable(),
  proteinKg: z
    .number()
    .min(0.1, { message: 'Protein minimal 0.1 kg' })
    .max(100, { message: 'Protein maksimal 100 kg' })
    .optional()
    .nullable(),
  mineralKg: z
    .number()
    .min(0.1, { message: 'Mineral minimal 0.1 kg' })
    .max(50, { message: 'Mineral maksimal 50 kg' })
    .optional()
    .nullable(),
});

export class UpsertProfileDto extends createZodDto(UpsertProfileSchema) {}

export const CheckInStatusSchema = z.object({
  needsUpdate: z.boolean(),
  daysSinceLastUpdate: z.number(),
  checkInIntervalDays: z.number(),
  message: z.string(),
});

export const ProfileUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  isAdmin: z.boolean(),
});

export const ProfileResponseSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  userId: z.string().uuid(),
  user: ProfileUserResponseSchema.optional(),
  profile: z.any().nullable().optional(),
  age: z.number().nullable().optional(),
  gender: z.nativeEnum(Gender).nullable().optional(),
  heightCm: z.number().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  activityLevel: z.nativeEnum(ActivityLevel).nullable().optional(),
  fitnessGoal: z.nativeEnum(FitnessGoal).nullable().optional(),
  dietPace: z.nativeEnum(DietPace).nullable().optional(),
  checkInIntervalDays: z.number().optional().default(30),
  skeletalMuscleKg: z.number().nullable().optional(),
  bodyFatPct: z.number().nullable().optional(),
  bodyFatKg: z.number().nullable().optional(),
  fatFreeMassKg: z.number().nullable().optional(),
  waterContentKg: z.number().nullable().optional(),
  proteinKg: z.number().nullable().optional(),
  mineralKg: z.number().nullable().optional(),
  checkInStatus: CheckInStatusSchema.nullable().optional(),
  message: z.string().default('Profil pengguna berhasil dimuat.'),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export class ProfileResponseDto extends createZodDto(ProfileResponseSchema) {}
