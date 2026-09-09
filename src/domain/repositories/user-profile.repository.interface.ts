import { UserProfileEntity } from '../entities/user-profile.entity';
import { Gender } from '../enums/gender.enum';
import { ActivityLevel } from '../enums/activity-level.enum';
import { FitnessGoal } from '../enums/fitness-goal.enum';
import { DietPace } from '../enums/diet-pace.enum';

export interface UpsertUserProfileData {
  userId: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  dietPace?: DietPace;
  checkInIntervalDays?: number;
}

export const USER_PROFILE_REPOSITORY = Symbol('IUserProfileRepository');

export interface IUserProfileRepository {
  upsert(data: UpsertUserProfileData): Promise<UserProfileEntity>;
  findByUserId(userId: string): Promise<UserProfileEntity | null>;
}
