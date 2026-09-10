import { Injectable } from '@nestjs/common';
import { EquipmentCategoryOptionDto } from '../../modules/exercises/schemas/exercise.schema';

export const EQUIPMENT_OPTIONS: EquipmentCategoryOptionDto[] = [
  { key: 'ALL', label: 'Semua Alat' },
  { key: 'TREADMILL', label: '🏃 Treadmill' },
  { key: 'DUMBBELL', label: 'Dumbbell' },
  { key: 'BARBELL', label: 'Barbell' },
  { key: 'CABLE', label: 'Cable' },
  { key: 'MACHINE', label: 'Mesin' },
  { key: 'SMITH', label: 'Smith' },
  { key: 'BODYWEIGHT', label: 'Bodyweight' },
  { key: 'STAIR_MASTER', label: 'StairMaster' },
  { key: 'STATIONARY_BIKE', label: 'Sepeda Statis' },
  { key: 'ROWING_MACHINE', label: 'Rowing Machine' },
  { key: 'ELLIPTICAL', label: 'Elliptical' },
  { key: 'OTHER', label: 'Lainnya' },
];

export const EQUIPMENT_DISPLAY_NAMES: Record<string, string> = {
  BARBELL: 'Barbell',
  DUMBBELL: 'Dumbbell',
  CABLE: 'Cable',
  MACHINE: 'Mesin',
  SMITH: 'Smith Machine',
  BODYWEIGHT: 'Bodyweight',
  TREADMILL: 'Treadmill',
  STATIONARY_BIKE: 'Sepeda Statis',
  STAIR_MASTER: 'StairMaster',
  ROWING_MACHINE: 'Rowing Machine',
  ELLIPTICAL: 'Elliptical',
  OTHER: 'Lainnya',
};

@Injectable()
export class GetEquipmentsUseCase {
  execute(): EquipmentCategoryOptionDto[] {
    return EQUIPMENT_OPTIONS;
  }
}
