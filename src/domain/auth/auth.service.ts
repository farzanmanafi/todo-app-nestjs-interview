import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { v4 as uuid } from 'uuid';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import {
  AuthResponse,
  AuthTokens,
  UserProfile,
} from '../../common/types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(TwoFactorAuth)
    private twoFactorRepository: Repository<TwoFactorAuth>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = signUpDto;

    // Use QueryRunner for transaction control
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check if user already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      // 2. Validate email format (additional check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Invalid email format');
      }

      // 3. Hash password
      const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS', 12));
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 4. Create user entity
      const user = queryRunner.manager.create(User, {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false,
        emailVerificationToken: uuid(),
      });

      // 5. Save user to database (still in transaction)
      const savedUser = await queryRunner.manager.save(User, user);

      // 6. Generate tokens (these are just JWTs, not saved to DB yet)
      const tokens = await this.generateTokensInTransaction(
        savedUser,
        queryRunner,
      );

      // 7. If everything succeeded, commit the transaction
      await queryRunner.commitTransaction();

      // 8. Return success response
      return {
        user: this.mapUserToProfile(savedUser),
        tokens,
      };
    } catch (error) {
      // If ANY error occurred, rollback the transaction
      // This ensures the user is NOT created in the database
      await queryRunner.rollbackTransaction();

      // Re-throw the error so the controller can handle it
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  /**
   * Generate tokens within a transaction
   */
  private async generateTokensInTransaction(
    user: User,
    queryRunner: any,
  ): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuid();

    const refreshExpiresIn = this.configService.get(
      'jwt.refreshExpiresIn',
      '7d',
    );

    const expiresAt = new Date();
    const timeValue = parseInt(refreshExpiresIn);
    const timeUnit = refreshExpiresIn.replace(timeValue.toString(), '');

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

    const refreshTokenEntity = queryRunner.manager.create(RefreshToken, {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    await queryRunner.manager.save(RefreshToken, refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  /**
   * Signs in a user
   *
   * @param {SignInDto} signInDto - signin request
   * @returns {Promise<AuthResponse>} - user profile and tokens
   * @throws {UnauthorizedException} - if invalid credentials
   * @throws {UnauthorizedException} - if account is deactivated
   */
  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    const { email, password } = signInDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['twoFactorAuth'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.mapUserToProfile(user),
      tokens,
    };
  }

  /**
   * Log out user by deleting the refresh token associated with their user.
   *
   * @param refreshToken - The refresh token to delete.
   * @returns A promise that resolves to an object with a single property 'message' that contains a success message.
   * @throws {UnauthorizedException} - If the refresh token is invalid or has expired.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Find refresh token in database
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    // 2. Check if token exists and hasn't expired
    if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 3. Generate NEW access token
    const accessToken = this.jwtService.sign({
      sub: tokenEntity.user.id,
      email: tokenEntity.user.email,
    });

    // 4. Return new access token
    return { accessToken };
  }

  /**
   * Log out user by deleting the refresh token associated with their user.
   * @param refreshToken - The refresh token to delete.
   * @returns A promise that resolves to an object with a single property 'message' that contains a success message.
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    // Find and delete the refresh token
    const result = await this.refreshTokenRepository.delete({
      token: refreshToken,
    });

    if (result.affected === 0) {
      // Token doesn't exist - might be already logged out
      // Don't throw error, just return success
      return { message: 'Already logged out' };
    }

    return { message: 'Logged out successfully' };
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserToProfile(user);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Generates access and refresh tokens for a given user.
   * @param user The user entity to generate tokens for.
   * @returns A promise containing the access and refresh tokens.
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    // 1. Create payload with user info
    const payload = { sub: user.id, email: user.email }; // "sub" = subject (standard JWT claim)

    // 2. Sign(create) ACCESS TOKEN (short-lived: 15 minutes)
    const accessToken = this.jwtService.sign(payload);

    // 3. Generate REFRESH TOKEN (long-lived: 7 days)
    const refreshToken = uuid();

    // Calculate expiration(Reads how long the refresh token should last — default 7 days if not set.)
    const refreshExpiresIn = this.configService.get(
      'jwt.refreshExpiresIn',
      '7d',
    );

    //Creates a Date object to calculate when the refresh token expires.
    const expiresAt = new Date();

    // Parse expiration string (e.g., "7d", "24h", "30m")
    const timeValue = parseInt(refreshExpiresIn);
    const timeUnit = refreshExpiresIn.replace(timeValue.toString(), '');

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
        expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
    }

    // Save refresh token
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  /**
   * Maps a User entity to a UserProfile object.
   * @param user The User entity to map.
   * @returns A UserProfile object containing user information.
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

  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
