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
        return date.toLocaleString('en-GB', {
            timeZone: 'Europe/Kyiv',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    private layout(content: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Slotifai</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f766e;padding:28px 40px;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Slotifai</span>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f6f9;padding:20px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © ${new Date().getFullYear()} Slotifai. This is an automated message, please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    }

    private appointmentInfo(details: AppointmentDetails): string {
        return `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;width:110px;">Service</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${details.serviceName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Master</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${details.masterName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Date & Time</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${this.formatDate(details.startTime)}</td>
              </tr>
            </table>
          </td></tr>
        </table>`;
    }

    private btn(text: string, url: string): string {
        return `<p style="text-align:center;margin:28px 0 0;">
          <a href="${url}" style="display:inline-block;background:#0f766e;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:8px;">${text}</a>
        </p>`;
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
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Confirm your email</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Thanks for signing up! Click the button below to verify your email address and get started.
              </p>
              ${this.btn('Verify email', verifyLink)}
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
                This link expires in 24 hours. If you didn't create an account, you can ignore this email.
              </p>
            `),
        );
    }

    async sendResetPassword(toEmail: string, resetLink: string): Promise<void> {
        await this.send(
            toEmail,
            'Reset your password — Slotifai',
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new one.
              </p>
              ${this.btn('Reset password', resetLink)}
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
                This link expires in 15 minutes. If you didn't request a password reset, you can ignore this email.
              </p>
            `),
        );
    }

    async sendAppointmentConfirmation(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Confirmed — Slotifai',
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Your appointment is confirmed!</h1>
              <p style="margin:0 0 4px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hi ${details.clientName}, we've got you booked in.
              </p>
              ${this.appointmentInfo(details)}
              <p style="margin:0;font-size:13px;color:#6b7280;">Free cancellation up to 4 hours before your appointment.</p>
            `),
        );
    }

    async sendAppointmentCancelledByMaster(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Cancelled — Slotifai',
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Appointment cancelled</h1>
              <p style="margin:0 0 4px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hi ${details.clientName}, unfortunately your appointment has been cancelled by the master.
              </p>
              ${this.appointmentInfo(details)}
              <p style="margin:0;font-size:13px;color:#6b7280;">We're sorry for the inconvenience. You can book a new appointment anytime.</p>
            `),
        );
    }

    async sendAppointmentCancelledByClient(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Cancelled by Client — Slotifai',
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Appointment cancelled</h1>
              <p style="margin:0 0 4px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hi ${details.masterName}, the client <b>${details.clientName}</b> has cancelled their appointment.
              </p>
              ${this.appointmentInfo(details)}
            `),
        );
    }

    async sendAppointmentCompleted(toEmail: string, details: AppointmentDetails, reviewLink: string): Promise<void> {
        await this.send(
            toEmail,
            'How was your appointment? — Slotifai',
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">How was it?</h1>
              <p style="margin:0 0 4px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hi ${details.clientName}, your appointment with <b>${details.masterName}</b> is complete. We'd love to hear your feedback!
              </p>
              ${this.appointmentInfo(details)}
              ${this.btn('Leave a review', reviewLink)}
            `),
        );
    }

    async sendAppointmentReminder(toEmail: string, details: AppointmentDetails): Promise<void> {
        await this.send(
            toEmail,
            'Appointment Reminder — Slotifai',
            this.layout(`
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reminder: appointment tomorrow</h1>
              <p style="margin:0 0 4px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hi ${details.clientName}, just a reminder about your upcoming appointment.
              </p>
              ${this.appointmentInfo(details)}
              <p style="margin:0;font-size:13px;color:#6b7280;">See you soon!</p>
            `),
        );
    }
}
