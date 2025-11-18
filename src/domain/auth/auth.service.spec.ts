import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

// Mock UUID for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let dataSource: DataSource;

  // Mock entities
  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    emailVerified: false,
    emailVerificationToken: 'verification-token',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
    refreshTokens: [],
  };

  const mockRefreshToken: RefreshToken = {
    id: 'token-uuid-1',
    token: 'refresh-token-123',
    userId: 'user-uuid-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    userAgent: '',
    ipAddress: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
    user: mockUser,
  };

  // Mock repositories
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockPasswordResetRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },

        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );

    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    dataSource = module.get<DataSource>(DataSource);

    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'BCRYPT_ROUNDS':
          return '12';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return null;
      }
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (uuid as jest.Mock).mockReturnValue('verification-token');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('access-token');
      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await authService.signUp(signUpDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
        emailVerificationToken: 'verification-token',
        isActive: true,
      });
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const signUpDtoWithUppercase: SignUpDto = {
        ...signUpDto,
        email: 'TEST@EXAMPLE.COM',
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (uuid as jest.Mock).mockReturnValue('verification-token');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('access-token');
      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      // Act
      await authService.signUp(signUpDtoWithUppercase);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        }),
      );
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const userWithPassword = {
      ...mockUser,
      password: 'hashed-password',
    };

    it('should successfully sign in user with valid credentials', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockJwtService.sign.mockReturnValue('access-token');
      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await authService.signIn(signInDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: [
          'id',
          'email',
          'password',
          'firstName',
          'lastName',
          'isActive',
          'emailVerified',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userWithPassword.id,
        {
          lastLoginAt: expect.any(Date),
        },
      );
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const inactiveUser = {
        ...userWithPassword,
        isActive: false,
      };
      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const futureDate = new Date(Date.now() + 1000000);
      const validRefreshToken = {
        ...mockRefreshToken,
        expiresAt: futureDate,
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(validRefreshToken);
      mockJwtService.sign.mockReturnValue('new-access-token');

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token: refreshToken },
        relations: ['user'],
      });
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException for non-existent refresh token', async () => {
      // Arrange
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 1000000);
      const expiredRefreshToken = {
        ...mockRefreshToken,
        expiresAt: pastDate,
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(expiredRefreshToken);
      mockRefreshTokenRepository.remove.mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(authService.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken('expired-token')).rejects.toThrow(
        'Refresh token has expired',
      );
      expect(mockRefreshTokenRepository.remove).toHaveBeenCalledWith(
        expiredRefreshToken,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 1000000);
      const refreshTokenWithInactiveUser = {
        ...mockRefreshToken,
        expiresAt: futureDate,
        user: { ...mockUser, isActive: false },
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(
        refreshTokenWithInactiveUser,
      );

      // Act & Assert
      await expect(authService.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken('valid-token')).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const refreshToken = 'refresh-token-to-delete';
      mockRefreshTokenRepository.delete.mockResolvedValue({
        affected: 1,
      } as any);

      // Act
      const result = await authService.logout(refreshToken);

      // Assert
      expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({
        token: refreshToken,
      });
      expect(result.message).toBe('Logged out successfully');
    });

    it('should return already logged out message when token not found', async () => {
      // Arrange
      const refreshToken = 'non-existent-token';
      mockRefreshTokenRepository.delete.mockResolvedValue({
        affected: 0,
      } as any);

      // Act
      const result = await authService.logout(refreshToken);

      // Assert
      expect(result.message).toBe('Already logged out');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await authService.getProfile('user-uuid-1');

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
      });
      expect(result.id).toBe('user-uuid-1');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid JWT payload', async () => {
      // Arrange
      const payload = { sub: 'user-uuid-1', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateUser(payload);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      const payload = { sub: 'non-existent-id', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.validateUser(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const payload = { sub: 'inactive-user-id', email: 'test@example.com' };
      // The query includes isActive: true, so inactive users won't be found
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.validateUser(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // Test private methods through public interface
  describe('Token Generation', () => {
    it('should generate tokens with correct structure through signIn', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const userWithPassword = {
        ...mockUser,
        password: 'hashed-password',
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockJwtService.sign.mockReturnValue('access-token');

      // Mock UUID for refresh token
      (uuid as jest.Mock).mockReturnValue('refresh-token-uuid');

      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await authService.signIn(signInDto);

      // Assert
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token-uuid');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
