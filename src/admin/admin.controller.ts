import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards
} from '@nestjs/common';
import {ApiBearerAuth, ApiQuery, ApiTags} from '@nestjs/swagger';
import {AdminService} from './admin.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {UserRole} from '../common/enums/user-role';
import {AppointmentStatus} from '../common/entities/appointmentStatus';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {
    }

    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @ApiQuery({name: 'role', required: false, enum: UserRole})
    @ApiQuery({name: 'search', required: false, type: String})
    @Get('users')
    getUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('role') role?: UserRole,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUsers(page ? +page : 1, limit ? +limit : 20, role, search);
    }

    @Patch('users/:id/block')
    blockUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.blockUser(id, true);
    }

    @Patch('users/:id/unblock')
    unblockUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.blockUser(id, false);
    }

    @Delete('users/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteUser(id);
    }

    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @Get('masters')
    getMasters(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.adminService.getMasters(page ? +page : 1, limit ? +limit : 20);
    }

    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @ApiQuery({name: 'status', required: false, enum: AppointmentStatus})
    @ApiQuery({name: 'date', required: false, type: String, description: 'YYYY-MM-DD'})
    @ApiQuery({name: 'masterId', required: false, type: Number})
    @Get('appointments')
    getAppointments(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: AppointmentStatus,
        @Query('date') date?: string,
        @Query('masterId') masterId?: string,
    ) {
        return this.adminService.getAppointments(
            page ? +page : 1,
            limit ? +limit : 20,
            status,
            date,
            masterId ? +masterId : undefined,
        );
    }

    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }
}
