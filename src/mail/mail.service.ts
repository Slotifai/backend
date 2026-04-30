import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import Mailjet from 'node-mailjet';

export interface AppointmentDetails {
    id: number;
    masterName: string;
    clientName: string;
    serviceName: string;
    startTime: Date;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly client: Mailjet;
    private readonly fromEmail: string;
    private readonly fromName: string;

    constructor(private readonly config: ConfigService) {
        this.fromEmail = config.getOrThrow<string>('MAIL_FROM_EMAIL');
        this.fromName = config.get<string>('MAIL_FROM_NAME', 'Slotifai');
        this.client = new Mailjet({
            apiKey: config.getOrThrow<string>('MAILJET_API_KEY'),
            apiSecret: config.getOrThrow<string>('MAILJET_SECRET_KEY'),
        });
    }

    private formatDate(date: Date): string {
        return date.toLocaleString('uk-UA', {timeZone: 'UTC'});
    }

    private async send(to: string, subject: string, htmlPart: string): Promise<void> {
        try {
            const result = await this.client.post('send', {version: 'v3.1'}).request({
                Messages: [
                    {
                        From: {Email: this.fromEmail, Name: this.fromName},
                        To: [{Email: to}],
                        Subject: subject,
                        HTMLPart: htmlPart,
                    },
                ],
            });
            this.logger.log(`Email sent to ${to}: ${JSON.stringify(result.body)}`);
        } catch (err) {
            this.logger.error(`Failed to send email to ${to}: ${JSON.stringify((err as any).response?.data ?? String(err))}`, (err as Error).stack);
        }
    }

    async sendVerifyEmail(toEmail: string, verifyLink: string): Promise<void> {
        await this.send(
            toEmail,
            'Verify your email — Slotifai',
            `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyLink}">Verify email</a></p>`,
        );
    }

    async sendResetPassword(toEmail: string, resetLink: string): Promise<void> {
        await this.send(
            toEmail,
            'Reset your password — Slotifai',
            `<p>Click the link below to reset your password (valid for 15 minutes):</p><p><a href="${resetLink}">Reset password</a></p>`,
        );
    }

    async sendAppointmentConfirmation(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Confirmed',
            `<p>Hi ${details.clientName}, your appointment with <b>${details.masterName}</b> for <b>${details.serviceName}</b> is confirmed for <b>${this.formatDate(details.startTime)}</b>.</p>`,
        );
    }

    async sendAppointmentCancelledByMaster(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Cancelled',
            `<p>Hi ${details.clientName}, unfortunately your appointment with <b>${details.masterName}</b> for <b>${details.serviceName}</b> on <b>${this.formatDate(details.startTime)}</b> has been cancelled by the master.</p>`,
        );
    }

    async sendAppointmentCancelledByClient(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Cancelled by Client',
            `<p>Hi ${details.masterName}, the client <b>${details.clientName}</b> has cancelled their appointment for <b>${details.serviceName}</b> on <b>${this.formatDate(details.startTime)}</b>.</p>`,
        );
    }

    async sendAppointmentCompleted(toEmail: string, details: AppointmentDetails, reviewLink: string): Promise<void> {
        await this.send(
            toEmail,
            'How was your appointment?',
            `<p>Hi ${details.clientName}, your appointment with <b>${details.masterName}</b> is completed! Please leave a review: <a href="${reviewLink}">Leave a review</a></p>`,
        );
    }

    async sendAppointmentReminder(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Reminder',
            `<p>Hi ${details.clientName}, reminder: you have an appointment with <b>${details.masterName}</b> for <b>${details.serviceName}</b> tomorrow at <b>${this.formatDate(details.startTime)}</b>.</p>`,
        );
    }
}
