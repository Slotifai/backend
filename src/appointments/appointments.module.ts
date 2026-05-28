import {forwardRef, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Appointment} from '../common/entities/appointment.entity';
import {AppointmentNote} from '../common/entities/appointment-note.entity';
import {Client} from '../common/entities/client.entity';
import {Master} from '../common/entities/master.entity';
import {Service} from '../common/entities/service.entity';
import {WorkingHours} from '../common/entities/working-hours.entity';
import {MailModule} from '../mail/mail.module';
import {AppointmentsService} from './appointments.service';
import {AppointmentsController} from './appointments.controller';
import {TelegramModule} from '../telegram/telegram.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, AppointmentNote, Client, Master, Service, WorkingHours]),
        MailModule,
        forwardRef(() => TelegramModule),
    ],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
    exports: [AppointmentsService],
})
export class AppointmentsModule {
}
