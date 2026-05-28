import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {createHash, randomBytes} from 'crypto';
import {User} from '../common/entities/user.entity';

@Injectable()
export class TelegramLinkService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    async generateLinkToken(userId: number): Promise<string> {
        const token = randomBytes(32).toString('hex');
        const hash = createHash('sha256').update(token).digest('hex');

        const user = await this.userRepository.findOne({where: {id: userId}});
        if (!user) throw new NotFoundException('User not found');

        user.tgLinkTokenHash = hash;
        await this.userRepository.save(user);

        return token;
    }

    async linkByToken(token: string, chatId: string): Promise<User | null> {
        const hash = createHash('sha256').update(token).digest('hex');
        const user = await this.userRepository.findOne({where: {tgLinkTokenHash: hash}});
        if (!user) return null;

        user.telegramChatId = chatId;
        user.tgLinkTokenHash = null;
        return this.userRepository.save(user);
    }

    async findUserByChatId(chatId: string): Promise<User | null> {
        return this.userRepository.findOne({where: {telegramChatId: chatId}});
    }
}
