import {Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiOkResponse, ApiTags} from '@nestjs/swagger';
import {Throttle} from '@nestjs/throttler';
import {AuthService} from './auth.service';
import {TelegramLinkService} from '../telegram/telegram-link.service';
import {RegisterClientDto} from './dto/register-client.dto';
import {RegisterMasterDto} from './dto/register-master.dto';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {ForgotPasswordDto} from './dto/forgot-password.dto';
import {ResetPasswordDto} from './dto/reset-password.dto';
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {CurrentUser} from './decorators/current-user.decorator';
import {User} from '../common/entities/user.entity';
import {ThrottlerGuard} from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly telegramLinkService: TelegramLinkService,
    ) {
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @Post('register/client')
    async registerClient(@Body() dto: RegisterClientDto) {
        return this.authService.registerClient(dto);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @Post('register/master')
    async registerMaster(@Body() dto: RegisterMasterDto) {
        return this.authService.registerMaster(dto);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({default: {ttl: 60000, limit: 10}})
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @Post('admin/login')
    async adminLogin(@Body() dto: LoginDto) {
        return this.authService.adminLogin(dto);
    }

    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refresh_token);
    }

    @Get('verify-email')
    @HttpCode(HttpStatus.NO_CONTENT)
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @Post('forgot-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({default: {ttl: 60000, limit: 5}})
    @Post('reset-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({
        description: 'Current authenticated user profile',
        schema: {
            example: {
                id: 1,
                email: 'user@example.com',
                role: 'client',
                isEmailVerified: true,
                createdAt: '2024-01-01T00:00:00.000Z',
                profile: {id: 1, name: 'John Doe', phone: '+380991234567'},
            },
        },
    })
    @Get('me')
    @Header('Cache-Control', 'no-store')
    async me(@CurrentUser() user: User) {
        return this.authService.me(user.id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout')
    async logout(@CurrentUser() user: User) {
        return this.authService.logout(user.id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('telegram-link-token')
    async telegramLinkToken(@CurrentUser() user: User) {
        const token = await this.telegramLinkService.generateLinkToken(user.id);
        return {token, deepLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`};
    }
}
