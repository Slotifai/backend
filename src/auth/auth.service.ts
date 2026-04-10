import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../common/entities/user.entity';
import { Client } from '../common/entities/client.entity';
import { Master } from '../common/entities/master.entity';
import { UserRole } from '../common/enums/user-role';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterMasterDto } from './dto/register-master.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async registerClient(dto: RegisterClientDto): Promise<{ message: string }> {
    await this.assertEmailFree(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { token: verifyToken, hash: emailVerifyTokenHash } = this.generateVerifyToken();

    await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        role: UserRole.CLIENT,
        emailVerifyTokenHash,
      });
      await manager.save(user);

      const client = manager.create(Client, {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        ...(dto.notes !== undefined && { notes: dto.notes }),
        user,
      });
      await manager.save(client);
    });

    await this.sendVerifyEmail(dto.email, verifyToken);
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async registerMaster(dto: RegisterMasterDto): Promise<{ message: string }> {
    await this.assertEmailFree(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { token: verifyToken, hash: emailVerifyTokenHash } = this.generateVerifyToken();

    await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        role: UserRole.MASTER,
        emailVerifyTokenHash,
      });
      await manager.save(user);

      const master = manager.create(Master, {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        ...(dto.specialization !== undefined && { specialization: dto.specialization }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        user,
      });
      await manager.save(master);
    });

    await this.sendVerifyEmail(dto.email, verifyToken);
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findOne({ where: { emailVerifyTokenHash: tokenHash } });

    if (!user) throw new BadRequestException('Invalid verification token');

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerifyTokenHash: null,
    });
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.verifyCredentials(dto.email, dto.password);
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    return this.generateTokens(user);
  }

  async adminLogin(dto: LoginDto): Promise<TokenPair> {
    const user = await this.verifyCredentials(dto.email, dto.password);
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    return this.generateTokens(user);
  }

  async refresh(rawToken: string): Promise<TokenPair> {
    let payload: { sub: number };
    try {
      payload = this.jwtService.verify(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(rawToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user);
  }

  async me(userId: number) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      relations: { client: true, master: true },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        client: { id: true, name: true, phone: true },
        master: { id: true, name: true, phone: true, specialization: true },
      },
    });

    const profile = user.client ?? user.master ?? null;
    return { id: user.id, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified, createdAt: user.createdAt, profile };
  }

  async logout(userId: number): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: null });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return;

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.update(user.id, { resetTokenHash, resetTokenExpiresAt });

    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    await this.mail.sendPasswordReset(email, resetLink);
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');

    const user = await this.userRepository.findOne({
      where: { resetTokenHash: tokenHash },
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(user.id, {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      refreshTokenHash: null,
    });
  }

  private async generateTokens(
    user: User,
    manager?: import('typeorm').EntityManager,
  ): Promise<TokenPair> {
    const payload = { sub: user.id, role: user.role, email: user.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const repo = manager
      ? manager.getRepository(User)
      : this.userRepository;
    await repo.update(user.id, { refreshTokenHash });

    return { accessToken, refreshToken };
  }

  private async verifyCredentials(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  private async assertEmailFree(email: string): Promise<void> {
    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already in use');
  }

  private generateVerifyToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  private async sendVerifyEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;
    await this.mail.sendVerificationEmail(email, verifyLink);
  }
}
