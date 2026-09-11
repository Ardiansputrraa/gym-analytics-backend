import {
  BodyMeasurementEntity,
  BodyCompositionStatus,
} from '../entities/body-measurement.entity';

export const BODY_MEASUREMENT_REPOSITORY_TOKEN = 'BODY_MEASUREMENT_REPOSITORY';

export interface CreateBodyMeasurementParams {
  userId: string;
  measuredAt: Date;
  receiptNumber?: string | null;
  weightKg: number;
  skeletalMuscleKg?: number | null;
  bodyFatKg?: number | null;
  bodyFatPct?: number | null;
  fatFreeMassKg?: number | null;
  waterContentKg?: number | null;
  proteinKg?: number | null;
  mineralKg?: number | null;
  bmi?: number | null;
  status?: BodyCompositionStatus | null;
  evaluation?: string | null;
  notes?: string | null;
}

export interface UpdateBodyMeasurementParams {
  measuredAt?: Date;
  receiptNumber?: string | null;
  weightKg?: number;
  skeletalMuscleKg?: number | null;
  bodyFatKg?: number | null;
  bodyFatPct?: number | null;
  fatFreeMassKg?: number | null;
  waterContentKg?: number | null;
  proteinKg?: number | null;
  mineralKg?: number | null;
  bmi?: number | null;
  status?: BodyCompositionStatus | null;
  evaluation?: string | null;
  notes?: string | null;
}

export interface GetBodyMeasurementsParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedBodyMeasurements {
  items: BodyMeasurementEntity[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface IBodyMeasurementRepository {
  create(params: CreateBodyMeasurementParams): Promise<BodyMeasurementEntity>;
  findById(id: string): Promise<BodyMeasurementEntity | null>;
  findLatestByUserId(userId: string): Promise<BodyMeasurementEntity | null>;
  findPrevious(userId: string, beforeDate: Date, excludeId?: string): Promise<BodyMeasurementEntity | null>;
  findHistoryByDateRange(userId: string, startDate: Date, endDate: Date): Promise<BodyMeasurementEntity[]>;
  findAllByUserId(params: GetBodyMeasurementsParams): Promise<PaginatedBodyMeasurements>;
  update(id: string, params: UpdateBodyMeasurementParams): Promise<BodyMeasurementEntity>;
  softDelete(id: string): Promise<boolean>;
}
