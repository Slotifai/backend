import {Column, Entity, PrimaryColumn, UpdateDateColumn} from 'typeorm';

@Entity('telegram_sessions')
export class TelegramSession {
    @PrimaryColumn({name: 'chat_id', type: 'bigint'})
    chatId: string;

    @Column({type: 'jsonb', default: {}})
    data: Record<string, unknown>;

    @UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
    updatedAt: Date;
}
