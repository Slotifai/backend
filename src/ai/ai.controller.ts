import {Body, Controller, HttpCode, Post, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {Throttle, ThrottlerGuard} from '@nestjs/throttler';
import {AiService} from './ai.service';
import {ChatRequestDto} from './dto/chat-request.dto';
import {ChatResponseDto} from './dto/chat-response.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {UserRole} from '../common/enums/user-role';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {
    }

    @Post('recommend')
    @UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLIENT)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @HttpCode(200)
    recommend(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
        return this.aiService.getRecommendation(dto.message);
    }

    @Post('chat')
    @UseGuards(ThrottlerGuard, JwtAuthGuard)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @HttpCode(200)
    chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
        return this.aiService.chat(dto.message);
    }
}
