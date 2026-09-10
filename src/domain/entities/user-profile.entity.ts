import { Gender } from '../enums/gender.enum';
import { ActivityLevel } from '../enums/activity-level.enum';
import { FitnessGoal } from '../enums/fitness-goal.enum';
import { DietPace } from '../enums/diet-pace.enum';

export interface UserProfileProps {
  id: string;
  userId: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  dietPace?: DietPace;
  checkInIntervalDays?: number;
  skeletalMuscleKg?: number | null;
  bodyFatPct?: number | null;
  bodyFatKg?: number | null;
  fatFreeMassKg?: number | null;
  waterContentKg?: number | null;
  proteinKg?: number | null;
  mineralKg?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfileEntity {
  readonly id: string;
  readonly userId: string;
  readonly age: number;
  readonly gender: Gender;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly activityLevel: ActivityLevel;
  readonly fitnessGoal: FitnessGoal;
  readonly dietPace: DietPace;
  readonly checkInIntervalDays: number;
  readonly skeletalMuscleKg: number | null;
  readonly bodyFatPct: number | null;
  readonly bodyFatKg: number | null;
  readonly fatFreeMassKg: number | null;
  readonly waterContentKg: number | null;
  readonly proteinKg: number | null;
  readonly mineralKg: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.age = props.age;
    this.gender = props.gender;
    this.heightCm = props.heightCm;
    this.weightKg = props.weightKg;
    this.activityLevel = props.activityLevel;
    this.fitnessGoal = props.fitnessGoal;
    this.dietPace = props.dietPace ?? DietPace.STANDARD;
    this.checkInIntervalDays = props.checkInIntervalDays ?? 30;
    this.skeletalMuscleKg = props.skeletalMuscleKg ?? null;
    this.bodyFatPct = props.bodyFatPct ?? null;
    this.bodyFatKg = props.bodyFatKg ?? null;
    this.fatFreeMassKg = props.fatFreeMassKg ?? null;
    this.waterContentKg = props.waterContentKg ?? null;
    this.proteinKg = props.proteinKg ?? null;
    this.mineralKg = props.mineralKg ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isCheckInDue(currentDate = new Date()): boolean {
    const diffTime = Math.abs(currentDate.getTime() - this.updatedAt.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= this.checkInIntervalDays;
  }

  daysSinceLastUpdate(currentDate = new Date()): number {
    const diffTime = Math.abs(currentDate.getTime() - this.updatedAt.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
