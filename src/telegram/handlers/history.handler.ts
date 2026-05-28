import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {AppointmentsService} from '../../appointments/appointments.service';
import {AppointmentStatus} from '../../common/entities/appointmentStatus';
import {mainMenuKeyboard} from './start.handler';

@Injectable()
export class HistoryHandler {
    constructor(private readonly appointmentsService: AppointmentsService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.hears('📜 Історія', async (ctx) => {
            try {
                if (!ctx.session.linkedUserId) {
                    await ctx.reply('⚠️ Для перегляду історії необхідно прив\'язати акаунт.');
                    return;
                }

                const {data} = await this.appointmentsService.getMyAppointments(ctx.session.linkedUserId, 1, 20);
                const past = data.filter((a) => a.status !== AppointmentStatus.SCHEDULED);

                if (!past.length) {
                    await ctx.reply('Історія записів порожня.', {reply_markup: mainMenuKeyboard()});
                    return;
                }

                const lines = past.slice(0, 10).map((a) => {
                    const time = a.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
                    const status = a.status === AppointmentStatus.COMPLETED ? '✅' : '❌';
                    return `${status} #${a.id} — ${a.master?.name ?? '—'} — ${a.service?.name ?? '—'} — ${time}`;
                });

                await ctx.reply(`<b>Історія записів:</b>\n\n${lines.join('\n')}`, {
                    parse_mode: 'HTML',
                    reply_markup: mainMenuKeyboard(),
                });
            } catch {
                await ctx.reply('Помилка завантаження історії.');
            }
        });
    }
}
