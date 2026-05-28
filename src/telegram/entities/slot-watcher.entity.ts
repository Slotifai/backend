import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {User} from '../../common/entities/user.entity';
import {Master} from '../../common/entities/master.entity';
import {Service} from '../../common/entities/service.entity';

@Entity('slot_watchers')
export class SlotWatcher {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'chat_id', type: 'bigint'})
    chatId: string;

    @Column({name: 'user_id', nullable: true})
    userId: number | null;

    @Column({name: 'master_id'})
    masterId: number;

    @Column({name: 'service_id'})
    serviceId: number;

    @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
    createdAt: Date;

    @ManyToOne(() => User, {onDelete: 'CASCADE', nullable: true})
    @JoinColumn({name: 'user_id'})
    user: User | null;

    @ManyToOne(() => Master, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'master_id'})
    master: Master;

    @ManyToOne(() => Service, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'service_id'})
    service: Service;
}
