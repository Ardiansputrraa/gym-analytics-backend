import { FitnessGoal } from '../enums/fitness-goal.enum';
import { DietPace } from '../enums/diet-pace.enum';

export interface DailyCalorieTargetProps {
  id: string;
  userId: string;
  date: Date;
  bmr: number;
  activityFactor: number;
  tdee: number;
  fitnessGoal: FitnessGoal;
  dietPace: DietPace;
  goalAdjustment: number;
  targetCalories: number;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DailyCalorieTargetEntity {
  readonly id: string;
  readonly userId: string;
  readonly date: Date;
  readonly bmr: number;
  readonly activityFactor: number;
  readonly tdee: number;
  readonly fitnessGoal: FitnessGoal;
  readonly dietPace: DietPace;
  readonly goalAdjustment: number;
  readonly targetCalories: number;
  readonly proteinGrams: number | null;
  readonly carbsGrams: number | null;
  readonly fatGrams: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DailyCalorieTargetProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.date = props.date;
    this.bmr = props.bmr;
    this.activityFactor = props.activityFactor;
    this.tdee = props.tdee;
    this.fitnessGoal = props.fitnessGoal;
    this.dietPace = props.dietPace;
    this.goalAdjustment = props.goalAdjustment;
    this.targetCalories = props.targetCalories;
    this.proteinGrams = props.proteinGrams ?? null;
    this.carbsGrams = props.carbsGrams ?? null;
    this.fatGrams = props.fatGrams ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
