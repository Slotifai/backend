import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards
} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {ServicesService} from './services.service';
import {CreateServiceDto} from './dto/create-service.dto';
import {UpdateServiceDto} from './dto/update-service.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {UserRole} from '../common/enums/user-role';
import {User} from '../common/entities/user.entity';

@ApiTags('services')
@Controller('masters')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Post('me/services')
    createService(@CurrentUser() user: User, @Body() dto: CreateServiceDto) {
        return this.servicesService.createService(user.id, dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Get('me/services')
    getMyServices(@CurrentUser() user: User) {
        return this.servicesService.getMyServices(user.id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Patch('me/services/:id')
    updateService(
        @CurrentUser() user: User,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateServiceDto,
    ) {
        return this.servicesService.updateService(user.id, id, dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Delete('me/services/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteService(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
        return this.servicesService.deleteService(user.id, id);
    }

    @Get(':id/services')
    getMasterServices(@Param('id', ParseIntPipe) id: number) {
        return this.servicesService.getMasterServices(id);
    }
}
