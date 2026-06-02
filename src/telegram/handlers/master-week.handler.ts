import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {AppointmentsService} from '../../appointments/appointments.service';
import {mainMenuKeyboard} from './start.handler';

@Injectable()
export class MasterWeekHandler {
    constructor(private readonly appointmentsService: AppointmentsService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.hears('📆 Розклад на тиждень', async (ctx) => {
            try {
                if (!ctx.session.linkedUserId) {
                    await ctx.reply('⚠️ Необхідно прив\'язати акаунт майстра.');
                    return;
                }

                const {data} = await this.appointmentsService.getMasterAppointments(
                    ctx.session.linkedUserId, 1, 50,
                );

                const now = new Date();
                const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const upcoming = data.filter((a) => a.startTime >= now && a.startTime <= weekEnd);

                if (!upcoming.length) {
                    await ctx.reply('На найближчий тиждень записів немає.', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
                    return;
                }

                const byDate = new Map<string, typeof upcoming>();
                for (const a of upcoming) {
                    const dateKey = a.startTime.toISOString().slice(0, 10);
                    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
                    byDate.get(dateKey)!.push(a);
                }

                const parts: string[] = [];
                for (const [date, appts] of byDate) {
                    const lines = appts.map((a) => {
                        const time = a.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'}).slice(12, 17);
                        return `  ⏰ ${time} — ${a.client?.name ?? '—'} — ${a.service?.name ?? '—'}`;
                    });
                    parts.push(`<b>${date}:</b>\n${lines.join('\n')}`);
                }

                await ctx.reply(`<b>Розклад на тиждень:</b>\n\n${parts.join('\n\n')}`, {
                    parse_mode: 'HTML',
                    reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole),
                });
            } catch {
                await ctx.reply('Помилка завантаження розкладу.');
            }
        });

        bot.command('week', async (ctx) => {
            await ctx.reply('Використовуйте кнопку 📆 Розклад на тиждень з меню.');
        });
    }
}
