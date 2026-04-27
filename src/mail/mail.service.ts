import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailjet from 'node-mailjet';

@Injectable()
export class MailService {
  private readonly client: Mailjet;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Mailjet({
      apiKey: config.getOrThrow<string>('MAILJET_API_KEY'),
      apiSecret: config.getOrThrow<string>('MAILJET_SECRET_KEY'),
    });
    this.fromEmail = config.getOrThrow<string>('MAIL_FROM_EMAIL');
    this.fromName = config.get<string>('MAIL_FROM_NAME', 'Slotifai');
  }

  async sendVerificationEmail(toEmail: string, verifyLink: string): Promise<void> {
    try {
      await this.client.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: { Email: this.fromEmail, Name: this.fromName },
            To: [{ Email: toEmail }],
            Subject: 'Email verification',
            HTMLPart: `
              <p>Thank you for registering!</p>
              <p>Click the button below to verify your email:</p>
              <p><a href="${verifyLink}" style="padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Verify email</a></p>
              <p>If you did not register — ignore this email.</p>
            `,
            TextPart: `Verify your email by following the link:\n${verifyLink}\n\nIf you did not register — ignore this email.`,
          },
        ],
      });
    } catch {
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendPasswordReset(toEmail: string, resetLink: string): Promise<void> {
    try {
      await this.client.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: { Email: this.fromEmail, Name: this.fromName },
            To: [{ Email: toEmail }],
            Subject: 'Password reset',
            HTMLPart: `
              <p>You requested a password reset.</p>
              <p>Click the button below to set a new password:</p>
              <p><a href="${resetLink}" style="padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
              <p>The link is valid for 15 minutes.</p>
              <p>If you did not request a password reset — ignore this email.</p>
            `,
            TextPart: `Follow the link to reset your password (valid for 15 minutes):\n${resetLink}\n\nIf you did not request a reset — ignore this email.`,
          },
        ],
      });
    } catch {
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
