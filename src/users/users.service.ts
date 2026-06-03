import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from '../common/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
        const user = await this.userRepository.findOne({where: {id: userId}});
        if (!user) throw new NotFoundException('User not found');

        if (user.avatarUrl) {
            const oldPath = path.join(process.cwd(), user.avatarUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const avatarUrl = `/uploads/avatars/${file.filename}`;
        await this.userRepository.update(userId, {avatarUrl});
        return {avatarUrl};
    }
}
