import {Controller, HttpCode, HttpStatus, Post, Request, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {extname} from 'path';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags} from '@nestjs/swagger';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {UsersService} from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    @Post('me/avatar')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Upload avatar for the authenticated user'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({schema: {type: 'object', properties: {file: {type: 'string', format: 'binary'}}}})
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/avatars',
            filename: (req, file, cb) => {
                const userId = (req as any).user?.id ?? 'unknown';
                const ext = extname(file.originalname).toLowerCase();
                cb(null, `${userId}-${Date.now()}${ext}`);
            },
        }),
        limits: {fileSize: 5 * 1024 * 1024},
        fileFilter: (_req, file, cb) => {
            const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
            if (allowed.test(extname(file.originalname))) {
                cb(null, true);
            } else {
                cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
            }
        },
    }))
    async uploadAvatar(
        @Request() req: any,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ avatarUrl: string }> {
        return this.usersService.uploadAvatar(req.user.id, file);
    }
}
