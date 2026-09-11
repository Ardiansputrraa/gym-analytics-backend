import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_PROFILE_REPOSITORY,
  type IUserProfileRepository,
} from '../../domain/repositories/user-profile.repository.interface';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import type { ProfileResponseDto } from '../../modules/profile/schemas';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException({
        message: 'Pengguna tidak ditemukan.',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    const profile = await this.profileRepository.findByUserId(userId);

    const userDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      isAdmin: user.isAdmin,
    };

    if (!profile) {
      return {
        id: null,
        userId: user.id,
        user: userDto,
        profile: null,
        age: null,
        gender: null,
        heightCm: null,
        weightKg: null,
        activityLevel: null,
        fitnessGoal: null,
        dietPace: null,
        checkInIntervalDays: 30,
        skeletalMuscleKg: null,
        bodyFatPct: null,
        bodyFatKg: null,
        fatFreeMassKg: null,
        waterContentKg: null,
        proteinKg: null,
        mineralKg: null,
        checkInStatus: null,
        message: 'Profil pengguna berhasil dimuat.',
        createdAt: null,
        updatedAt: null,
      };
    }

    const today = new Date();
    const needsUpdate = profile.isCheckInDue(today);
    const daysSinceLastUpdate = profile.daysSinceLastUpdate(today);

    return {
      id: profile.id,
      userId: profile.userId,
      user: userDto,
      profile: {
        id: profile.id,
        userId: profile.userId,
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel: profile.activityLevel,
        fitnessGoal: profile.fitnessGoal,
        dietPace: profile.dietPace,
        checkInIntervalDays: profile.checkInIntervalDays,
        skeletalMuscleKg: profile.skeletalMuscleKg,
        bodyFatPct: profile.bodyFatPct,
        bodyFatKg: profile.bodyFatKg,
        fatFreeMassKg: profile.fatFreeMassKg,
        waterContentKg: profile.waterContentKg,
        proteinKg: profile.proteinKg,
        mineralKg: profile.mineralKg,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
      checkInIntervalDays: profile.checkInIntervalDays,
      skeletalMuscleKg: profile.skeletalMuscleKg,
      bodyFatPct: profile.bodyFatPct,
      bodyFatKg: profile.bodyFatKg,
      fatFreeMassKg: profile.fatFreeMassKg,
      waterContentKg: profile.waterContentKg,
      proteinKg: profile.proteinKg,
      mineralKg: profile.mineralKg,
      checkInStatus: {
        needsUpdate,
        daysSinceLastUpdate,
        checkInIntervalDays: profile.checkInIntervalDays,
        message: needsUpdate
          ? `Sudah ${daysSinceLastUpdate} hari sejak update profil terakhir. Timbang berat badan Anda untuk kalibrasi target kalori yang lebih akurat.`
          : `Profil aktif. Update berikutnya dalam ${Math.max(0, profile.checkInIntervalDays - daysSinceLastUpdate)} hari.`,
      },
      message: 'Profil pengguna berhasil dimuat.',
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
