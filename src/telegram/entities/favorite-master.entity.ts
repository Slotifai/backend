import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import {User} from '../../common/entities/user.entity';
import {Master} from '../../common/entities/master.entity';

@Entity('favorite_masters')
@Unique(['userId', 'masterId'])
export class FavoriteMaster {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'user_id'})
    userId: number;

    @Column({name: 'master_id'})
    masterId: number;

    @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
    createdAt: Date;

    @ManyToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User;

    @ManyToOne(() => Master, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'master_id'})
    master: Master;
}
