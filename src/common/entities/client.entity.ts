import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Review } from './review.entity';
import { User } from './user.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.client, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments: Appointment[];

  @OneToMany(() => Review, (review) => review.client)
  reviews: Review[];
}
