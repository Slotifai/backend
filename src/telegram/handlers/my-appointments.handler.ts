import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {AppointmentsService} from '../../appointments/appointments.service';
import {AppointmentStatus} from '../../common/entities/appointmentStatus';
import {mainMenuKeyboard} from './start.handler';

@Injectable()
export class MyAppointmentsHandler {
    constructor(private readonly appointmentsService: AppointmentsService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.hears('📋 Мої записи', async (ctx) => {
            try {
                if (!ctx.session.linkedUserId) {
                    await ctx.reply('⚠️ Для перегляду записів необхідно прив\'язати акаунт.\nВикористайте /start [токен] для прив\'язки.');
                    return;
                }

                const {data} = await this.appointmentsService.getMyAppointments(ctx.session.linkedUserId, 1, 10);
                const upcoming = data.filter((a) => a.status === AppointmentStatus.SCHEDULED);

                if (!upcoming.length) {
                    await ctx.reply('У вас немає майбутніх записів.', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
                    return;
                }

                for (const appt of upcoming) {
                    const time = appt.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
                    await ctx.reply(
                        `📅 <b>Запис #${appt.id}</b>\n` +
                        `👨‍🔧 Майстер: ${appt.master?.name ?? '—'}\n` +
                        `💈 Послуга: ${appt.service?.name ?? '—'}\n` +
                        `⏰ Час: ${time}`,
                        {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [{text: '❌ Скасувати', callback_data: `cancel_appt:${appt.id}`}],
                                    [{text: '🔄 Перезаписатися', callback_data: `rebook:${appt.id}`}],
                                ],
                            },
                        },
                    );
                }
            } catch {
                await ctx.reply('Помилка завантаження записів.');
            }
        });

        bot.callbackQuery(/^cancel_appt:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            if (!ctx.session.linkedUserId) {
                await ctx.reply('Необхідно прив\'язати акаунт.');
                return;
            }
            try {
                const appointmentId = parseInt(ctx.match[1], 10);
                await this.appointmentsService.cancelAppointment(ctx.session.linkedUserId, appointmentId);
                await ctx.reply(`✅ Запис #${appointmentId} скасовано.`);
            } catch (err) {
                await ctx.reply(`❌ Не вдалося скасувати: ${err instanceof Error ? err.message : 'Помилка'}`);
            }
        });
    }
}
