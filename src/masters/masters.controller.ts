import { Body, Controller, Get, Param, ParseIntPipe, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MastersService } from './masters.service';
import { UpdateMasterDto } from './dto/update-master.dto';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role';
import { User } from '../common/entities/user.entity';

@ApiTags('masters')
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

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

  @Get(':id')
  getPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.mastersService.getPublicProfile(id);
  }
}
