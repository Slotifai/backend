import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { WorkingHours } from './working-hours.entity';
import { Service } from './service.entity';
import { User } from './user.entity';

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

  @OneToOne(() => User, (user) => user.master, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @OneToMany(() => Appointment, (appointment) => appointment.master)
  appointments: Appointment[];

  @OneToMany(() => WorkingHours, (wh) => wh.master)
  workingHours: WorkingHours[];

  @OneToMany(() => Service, (service) => service.master)
  services: Service[];
}
