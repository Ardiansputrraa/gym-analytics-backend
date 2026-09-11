import { Inject, Injectable } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { RoutineTemplateEntity } from '../../domain/entities/workout.entity';

@Injectable()
export class GetRoutineTemplatesUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(): Promise<RoutineTemplateEntity[]> {
    return this.workoutRepository.findRoutineTemplates();
  }
}
