import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role';
import { Client } from './client.entity';
import { Master } from './master.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'email_verify_token_hash', length: 64, nullable: true, unique: true })
  emailVerifyTokenHash: string | null;

  @Column({ name: 'refresh_token_hash', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'reset_token_hash', length: 64, nullable: true, unique: true })
  resetTokenHash: string | null;

  @Column({ name: 'reset_token_expires_at', type: 'timestamptz', nullable: true })
  resetTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Client, (client) => client.user, { nullable: true })
  client: Client | null;

  @OneToOne(() => Master, (master) => master.user, { nullable: true })
  master: Master | null;
}
