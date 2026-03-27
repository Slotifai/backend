import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AppointmentStatus } from './appointmentStatus';
import { Client } from './client.entity';
import { Master } from './master.entity';
import { Service } from './service.entity';
import { AppointmentNote } from './appointment-note.entity';
import { Review } from './review.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @Column({ name: 'master_id' })
  masterId: number;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Client, (client) => client.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Service, (service) => service.appointments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Master, (master) => master.appointments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'master_id' })
  master: Master;

  @OneToMany(() => AppointmentNote, (note) => note.appointment)
  notes: AppointmentNote[];

  @OneToMany(() => Review, (review) => review.appointment)
  reviews: Review[];
}
