import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {AppointmentsService} from '../../appointments/appointments.service';

@Injectable()
export class RebookHandler {
    constructor(private readonly appointmentsService: AppointmentsService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.callbackQuery(/^rebook:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            if (!ctx.session.linkedUserId) {
                await ctx.reply('Необхідно прив\'язати акаунт.');
                return;
            }

            try {
                const appointmentId = parseInt(ctx.match[1], 10);
                const {data} = await this.appointmentsService.getMyAppointments(ctx.session.linkedUserId, 1, 100);
                const appt = data.find((a) => a.id === appointmentId);

                if (!appt) {
                    await ctx.reply('Запис не знайдено.');
                    return;
                }

                ctx.session.step = 'AWAITING_SLOT_SELECT';
                ctx.session.selectedMasterId = appt.masterId;
                ctx.session.selectedServiceId = appt.serviceId;

                await ctx.reply(
                    `Перезапис до ${appt.master?.name ?? 'майстра'} на послугу "${appt.service?.name ?? '—'}".\nОберіть новий час:`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: '📅 Обрати час', callback_data: 'slot_day:0'}],
                                [{text: '❌ Скасувати', callback_data: 'book_cancel'}],
                            ],
                        },
                    },
                );
            } catch {
                await ctx.reply('Помилка при перезаписі.');
            }
        });
    }
}
