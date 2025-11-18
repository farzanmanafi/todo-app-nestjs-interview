import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import {
  AuthResponse,
  AuthTokens,
  UserProfile,
} from '../../common/types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS', 12));

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailVerified: false,
      emailVerificationToken: uuid(),
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: this.mapUserToProfile(savedUser),
      tokens,
    };
  }

  /**
   * Sign in user with credentials
   */
  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    const { email, password } = signInDto;

    // Find user with password
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
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

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`User signed in: ${user.email}`);

    return {
      user: this.mapUserToProfile(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntity.expiresAt < new Date()) {
      // Clean up expired token
      await this.refreshTokenRepository.remove(tokenEntity);
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!tokenEntity.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign({
      sub: tokenEntity.user.id,
      email: tokenEntity.user.email,
    });

    this.logger.log(
      `Access token refreshed for user: ${tokenEntity.user.email}`,
    );

    return { accessToken };
  }

  /**
   * Log out user
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const result = await this.refreshTokenRepository.delete({
      token: refreshToken,
    });

    if (result.affected === 0) {
      return { message: 'Already logged out' };
    }

    this.logger.log('User logged out successfully');
    return { message: 'Logged out successfully' };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToProfile(user);
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Generate tokens within a transaction
   */
  private async generateTokensInTransaction(
    user: User,
    queryRunner: any,
  ): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = uuid();
    const expiresAt = this.calculateTokenExpiration(
      this.configService.get('jwt.refreshExpiresIn', '7d'),
    );

    const refreshTokenEntity = queryRunner.manager.create(RefreshToken, {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    await queryRunner.manager.save(RefreshToken, refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  /**
   * Generate tokens (non-transaction version)
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = uuid();
    const expiresAt = this.calculateTokenExpiration(
      this.configService.get('jwt.refreshExpiresIn', '7d'),
    );

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  /**
   * Calculate token expiration date
   */
  private calculateTokenExpiration(expiresIn: string): Date {
    const expiresAt = new Date();
    const timeValue = parseInt(expiresIn);
    const timeUnit = expiresIn.replace(timeValue.toString(), '');

    switch (timeUnit) {
      case 'd':
        expiresAt.setDate(expiresAt.getDate() + timeValue);
        break;
      case 'h':
        expiresAt.setHours(expiresAt.getHours() + timeValue);
        break;
      case 'm':
        expiresAt.setMinutes(expiresAt.getMinutes() + timeValue);
        break;
      default:
        expiresAt.setDate(expiresAt.getDate() + 7);
    }

    return expiresAt;
  }

  /**
   * Map User entity to UserProfile
   */
  private mapUserToProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
