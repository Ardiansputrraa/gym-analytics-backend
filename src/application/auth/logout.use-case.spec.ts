import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;

  beforeEach(() => {
    useCase = new LogoutUseCase();
  });

  it('should successfully process logout', async () => {
    const result = await useCase.execute({});
    expect(result).toEqual({
      success: true,
      message: 'Logged out successfully',
    });
  });

  it('should process logout when no dto is provided', async () => {
    const result = await useCase.execute();
    expect(result.success).toBe(true);
  });
});
