import {Injectable, Logger} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from './telegram.types';

@Injectable()
export class TelegramNotifyService {
    private readonly logger = new Logger(TelegramNotifyService.name);
    private bot: Bot<BotContext> | null = null;

    setBot(bot: Bot<BotContext>): void {
        this.bot = bot;
    }

    async sendMessage(chatId: string | number, text: string): Promise<void> {
        if (!this.bot) {
            this.logger.warn('Bot not initialized, cannot send message');
            return;
        }
        try {
            await this.bot.api.sendMessage(String(chatId), text, {parse_mode: 'HTML'});
        } catch (err) {
            this.logger.error(`Failed to send Telegram message to ${chatId}: ${String(err)}`);
        }
    }

    async notifyMasterNewBooking(
        masterChatId: string,
        details: {clientName: string; serviceName: string; startTime: Date},
    ): Promise<void> {
        const time = details.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
        await this.sendMessage(
            masterChatId,
            `📅 <b>Новий запис!</b>\nКлієнт: ${details.clientName}\nПослуга: ${details.serviceName}\nЧас: ${time}`,
        );
    }

    async notifyMasterCancelledByClient(
        masterChatId: string,
        details: {clientName: string; serviceName: string; startTime: Date},
    ): Promise<void> {
        const time = details.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
        await this.sendMessage(
            masterChatId,
            `❌ <b>Запис скасовано клієнтом</b>\nКлієнт: ${details.clientName}\nПослуга: ${details.serviceName}\nЧас: ${time}`,
        );
    }

    async notifyClientCancelledByMaster(
        clientChatId: string,
        details: {masterName: string; serviceName: string; startTime: Date},
    ): Promise<void> {
        const time = details.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
        await this.sendMessage(
            clientChatId,
            `❌ <b>Майстер скасував ваш запис</b>\nМайстер: ${details.masterName}\nПослуга: ${details.serviceName}\nЧас: ${time}`,
        );
    }

    async sendReviewPrompt(chatId: string, appointmentId: number, masterName: string): Promise<void> {
        if (!this.bot) return;
        try {
            await this.bot.api.sendMessage(
                chatId,
                `⭐ Як вам візит до майстра <b>${masterName}</b>? Залиште відгук:`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: '⭐', callback_data: `review_rate:${appointmentId}:1`},
                                {text: '⭐⭐', callback_data: `review_rate:${appointmentId}:2`},
                                {text: '⭐⭐⭐', callback_data: `review_rate:${appointmentId}:3`},
                                {text: '⭐⭐⭐⭐', callback_data: `review_rate:${appointmentId}:4`},
                                {text: '⭐⭐⭐⭐⭐', callback_data: `review_rate:${appointmentId}:5`},
                            ],
                        ],
                    },
                },
            );
        } catch (err) {
            this.logger.error(`Failed to send review prompt to ${chatId}: ${String(err)}`);
        }
    }

    async sendReminderMessage(chatId: string, details: {masterName: string; serviceName: string; startTime: Date}): Promise<void> {
        const time = details.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
        await this.sendMessage(
            chatId,
            `⏰ <b>Нагадування про запис</b>\nМайстер: ${details.masterName}\nПослуга: ${details.serviceName}\nЧас: ${time}`,
        );
    }
}
