import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Master } from './master.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'master_id' })
  masterId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Master, (master) => master.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'master_id' })
  master: Master;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];
}
