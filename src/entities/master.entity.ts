import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { WorkingHours } from './working-hours.entity';

@Entity('masters')
export class Master {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  specialization: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.master)
  appointments: Appointment[];

  @OneToMany(() => WorkingHours, (wh) => wh.master)
  workingHours: WorkingHours[];
}
