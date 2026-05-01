import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Master} from '../common/entities/master.entity';
import {WorkingHours} from '../common/entities/working-hours.entity';
import {Appointment} from '../common/entities/appointment.entity';
import {Service} from '../common/entities/service.entity';
import {MastersService} from './masters.service';
import {MastersController} from './masters.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Master, WorkingHours, Appointment, Service])],
    providers: [MastersService],
    controllers: [MastersController],
})
export class MastersModule {
}
