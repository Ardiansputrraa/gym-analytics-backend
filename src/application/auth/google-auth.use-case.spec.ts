import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GoogleAuthUseCase } from './google-auth.use-case';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';

describe('GoogleAuthUseCase', () => {
  let useCase: GoogleAuthUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      markEmailVerified: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked-google-jwt-token'),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn().mockReturnValue('15m'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    useCase = module.get<GoogleAuthUseCase>(GoogleAuthUseCase);
  });

  it('should auto-register new user via Google SSO if user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (data) => {
      return new UserEntity({
        id: 'new-google-user-uuid',
        email: data.email,
        name: data.name,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash,
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
    });

    const result = await useCase.execute({
      email: 'newathlete@gmail.com',
      name: 'New Athlete',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('newathlete@gmail.com');
    expect(userRepository.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('mocked-google-jwt-token');
    expect(result.user.email).toBe('newathlete@gmail.com');
    expect(result.user.name).toBe('New Athlete');
    expect(result.user.isAdmin).toBe(false);
  });

  it('should log in existing user via Google SSO and ensure email is verified', async () => {
    const existingUser = new UserEntity({
      id: 'existing-user-uuid',
      email: 'existing@gmail.com',
      name: 'Existing Athlete',
      phone: null,
      passwordHash: 'hash',
      isAdmin: false,
      isActive: true,
      emailVerifiedAt: null, // not verified yet
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    userRepository.findByEmail.mockResolvedValue(existingUser);
    userRepository.markEmailVerified.mockResolvedValue({
      ...existingUser,
      emailVerifiedAt: new Date(),
    } as UserEntity);

    const result = await useCase.execute({
      email: 'existing@gmail.com',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('existing@gmail.com');
    expect(userRepository.markEmailVerified).toHaveBeenCalledWith('existing-user-uuid', expect.any(Date));
    expect(result.accessToken).toBe('mocked-google-jwt-token');
    expect(result.user.email).toBe('existing@gmail.com');
    expect(result.user.isAdmin).toBe(false);
  });

  it('should throw ForbiddenException if user account is deactivated/suspended', async () => {
    const suspendedUser = new UserEntity({
      id: 'suspended-user-uuid',
      email: 'suspended@gmail.com',
      name: 'Suspended Athlete',
      phone: null,
      passwordHash: 'hash',
      isAdmin: false,
      isActive: false, // suspended
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    userRepository.findByEmail.mockResolvedValue(suspendedUser);

    await expect(
      useCase.execute({
        email: 'suspended@gmail.com',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if no email or token can be resolved', async () => {
    await expect(
      useCase.execute({}),
    ).rejects.toThrow(BadRequestException);
  });
});
