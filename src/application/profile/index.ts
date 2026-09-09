import { UpsertProfileUseCase } from './upsert-profile.use-case';
import { GetProfileUseCase } from './get-profile.use-case';

export * from './upsert-profile.use-case';
export * from './get-profile.use-case';

export const PROFILE_USE_CASES = [UpsertProfileUseCase, GetProfileUseCase];
