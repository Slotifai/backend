import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {InjectRepository} from '@nestjs/typeorm';
import {Between, Repository} from 'typeorm';
import {Appointment} from '../common/entities/appointment.entity';
import {AppointmentStatus} from '../common/entities/appointmentStatus';
import {MailService} from '../mail/mail.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly mailService: MailService,
    ) {
    }

    @Cron(CronExpression.EVERY_HOUR)
    async sendReminders(): Promise<void> {
        const now = new Date();
        const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        const appointments = await this.appointmentRepository.find({
            where: {
                status: AppointmentStatus.SCHEDULED,
                startTime: Between(from, to),
            },
            relations: {client: {user: true}, master: true, service: true},
        });

        for (const appointment of appointments) {
            const clientEmail = appointment.client?.user?.email;
            if (!clientEmail) continue;

            try {
                await this.mailService.sendAppointmentReminder(clientEmail, {
                    id: appointment.id,
                    masterName: appointment.master?.name ?? 'Master',
                    clientName: appointment.client?.name ?? 'Client',
                    serviceName: appointment.service?.name ?? 'Service',
                    startTime: appointment.startTime,
                });
                this.logger.log(`Reminder sent for appointment #${appointment.id}`);
            } catch (err) {
                this.logger.error(`Failed reminder for appointment #${appointment.id}: ${String(err)}`);
            }
        }
    }
}
