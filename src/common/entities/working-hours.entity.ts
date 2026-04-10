import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Master } from './master.entity';

@Entity('working_hours')
export class WorkingHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'master_id' })
  masterId: number;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'is_day_off', default: false })
  isDayOff: boolean;

  @ManyToOne(() => Master, (master) => master.workingHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'master_id' })
  master: Master;
}
