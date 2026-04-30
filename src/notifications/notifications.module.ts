import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Appointment} from '../common/entities/appointment.entity';
import {MailModule} from '../mail/mail.module';
import {NotificationsService} from './notifications.service';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment]), MailModule],
    providers: [NotificationsService],
})
export class NotificationsModule {
}
