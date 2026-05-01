import {Body, Controller, Get, Param, ParseIntPipe, Patch, Put, Query, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiQuery, ApiTags} from '@nestjs/swagger';
import {MastersService} from './masters.service';
import {UpdateMasterDto} from './dto/update-master.dto';
import {SetWorkingHoursDto} from './dto/set-working-hours.dto';
import {QueryMastersDto} from './dto/query-masters.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {UserRole} from '../common/enums/user-role';
import {User} from '../common/entities/user.entity';

@ApiTags('masters')
@Controller('masters')
export class MastersController {
    constructor(private readonly mastersService: MastersService) {
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Get('me')
    getMyProfile(@CurrentUser() user: User) {
        return this.mastersService.getMyProfile(user.id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Patch('me')
    updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateMasterDto) {
        return this.mastersService.updateMyProfile(user.id, dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Get('me/working-hours')
    getWorkingHours(@CurrentUser() user: User) {
        return this.mastersService.getWorkingHours(user.id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER)
    @Put('me/working-hours')
    setWorkingHours(@CurrentUser() user: User, @Body() dto: SetWorkingHoursDto) {
        return this.mastersService.setWorkingHours(user.id, dto);
    }

    @Get()
    findAll(@Query() query: QueryMastersDto) {
        return this.mastersService.findAll(query);
    }

    @ApiQuery({name: 'date', required: true, description: 'YYYY-MM-DD'})
    @ApiQuery({name: 'serviceId', required: true, type: Number})
    @Get(':id/availability')
    getAvailability(
        @Param('id', ParseIntPipe) id: number,
        @Query('date') date: string,
        @Query('serviceId', ParseIntPipe) serviceId: number,
    ) {
        return this.mastersService.getAvailability(id, date, serviceId);
    }

    @Get(':id')
    getPublicProfile(@Param('id', ParseIntPipe) id: number) {
        return this.mastersService.getPublicProfile(id);
    }
}
