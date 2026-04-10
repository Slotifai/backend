import {Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {RegisterClientDto} from './dto/register-client.dto';
import {RegisterMasterDto} from './dto/register-master.dto';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {ForgotPasswordDto} from './dto/forgot-password.dto';
import {ResetPasswordDto} from './dto/reset-password.dto';
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {CurrentUser} from './decorators/current-user.decorator';
import {User} from '../common/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('register/client')
    async registerClient(@Body() dto: RegisterClientDto) {
        return this.authService.registerClient(dto);
    }

    @Post('register/master')
    async registerMaster(@Body() dto: RegisterMasterDto) {
        return this.authService.registerMaster(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

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

    @Post('forgot-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
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
}
