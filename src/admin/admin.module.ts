import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from '../common/entities/user.entity';
import {Appointment} from '../common/entities/appointment.entity';
import {Master} from '../common/entities/master.entity';
import {AdminService} from './admin.service';
import {AdminController} from './admin.controller';

@Module({
    imports: [TypeOrmModule.forFeature([User, Appointment, Master])],
    providers: [AdminService],
    controllers: [AdminController],
})
export class AdminModule {
}
