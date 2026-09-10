export class MuscleGroupEntity {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MuscleGroupEntity>) {
    Object.assign(this, partial);
  }
}
