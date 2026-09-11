import { Injectable, Inject } from '@nestjs/common';
import {
  IBodyMeasurementRepository,
  BODY_MEASUREMENT_REPOSITORY_TOKEN,
  GetBodyMeasurementsParams,
  PaginatedBodyMeasurements,
} from '../../domain/repositories/body-measurement.repository.interface';

@Injectable()
export class GetBodyMeasurementsUseCase {
  constructor(
    @Inject(BODY_MEASUREMENT_REPOSITORY_TOKEN)
    private readonly bodyMeasurementRepository: IBodyMeasurementRepository,
  ) {}

  async execute(params: GetBodyMeasurementsParams): Promise<PaginatedBodyMeasurements> {
    return this.bodyMeasurementRepository.findAllByUserId(params);
  }
}
