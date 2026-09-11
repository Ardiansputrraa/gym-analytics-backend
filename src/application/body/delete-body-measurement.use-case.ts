import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IBodyMeasurementRepository,
  BODY_MEASUREMENT_REPOSITORY_TOKEN,
} from '../../domain/repositories/body-measurement.repository.interface';

@Injectable()
export class DeleteBodyMeasurementUseCase {
  constructor(
    @Inject(BODY_MEASUREMENT_REPOSITORY_TOKEN)
    private readonly bodyMeasurementRepository: IBodyMeasurementRepository,
  ) {}

  async execute(userId: string, id: string): Promise<boolean> {
    const measurement = await this.bodyMeasurementRepository.findById(id);
    if (!measurement) {
      throw new NotFoundException('Data pengukuran tidak ditemukan.');
    }

    if (measurement.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus data ini.');
    }

    return this.bodyMeasurementRepository.softDelete(id);
  }
}
