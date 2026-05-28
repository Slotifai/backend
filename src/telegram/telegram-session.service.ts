import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {StorageAdapter} from 'grammy';
import {TelegramSession} from './entities/telegram-session.entity';
import {BookingSessionData} from './dto/booking-state.dto';

@Injectable()
export class TelegramSessionService implements StorageAdapter<BookingSessionData> {
    constructor(
        @InjectRepository(TelegramSession)
        private readonly sessionRepository: Repository<TelegramSession>,
    ) {
    }

    async read(key: string): Promise<BookingSessionData | undefined> {
        const session = await this.sessionRepository.findOne({where: {chatId: key}});
        if (!session) return undefined;
        return session.data as unknown as BookingSessionData;
    }

    async write(key: string, value: BookingSessionData): Promise<void> {
        await this.sessionRepository.query(
            `INSERT INTO telegram_sessions (chat_id, data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (chat_id) DO UPDATE SET data = $2, updated_at = NOW()`,
            [key, JSON.stringify(value)],
        );
    }

    async delete(key: string): Promise<void> {
        await this.sessionRepository.delete({chatId: key});
    }
}
