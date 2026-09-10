import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_PROFILE_REPOSITORY,
  type IUserProfileRepository,
} from '../../domain/repositories/user-profile.repository.interface';
import type { ProfileResponseDto } from '../../modules/profile/schemas';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException({
        message:
          'Profil pengguna tidak ditemukan. Silakan lengkapi profil Anda untuk menghitung target kalori yang sesuai.',
        code: 'PROFILE_NOT_FOUND',
        errors: [],
      });
    }

    const today = new Date();
    const needsUpdate = profile.isCheckInDue(today);
    const daysSinceLastUpdate = profile.daysSinceLastUpdate(today);

    return {
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
      checkInStatus: {
        needsUpdate,
        daysSinceLastUpdate,
        checkInIntervalDays: profile.checkInIntervalDays,
        message: needsUpdate
          ? `Sudah ${daysSinceLastUpdate} hari sejak update profil terakhir. Timbang berat badan Anda untuk kalibrasi target kalori yang lebih akurat.`
          : `Profil aktif. Update berikutnya dalam ${Math.max(0, profile.checkInIntervalDays - daysSinceLastUpdate)} hari.`,
      },
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
