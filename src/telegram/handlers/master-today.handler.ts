import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {AppointmentsService} from '../../appointments/appointments.service';
import {mainMenuKeyboard} from './start.handler';

@Injectable()
export class MasterTodayHandler {
    constructor(private readonly appointmentsService: AppointmentsService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.hears('👨‍🔧 Розклад на сьогодні', async (ctx) => {
            try {
                if (!ctx.session.linkedUserId) {
                    await ctx.reply('⚠️ Необхідно прив\'язати акаунт майстра.');
                    return;
                }

                const today = new Date().toISOString().slice(0, 10);
                const {data} = await this.appointmentsService.getMasterAppointments(
                    ctx.session.linkedUserId, 1, 50, undefined, today,
                );

                if (!data.length) {
                    await ctx.reply('На сьогодні записів немає.', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
                    return;
                }

                const lines = data.map((a) => {
                    const time = a.startTime.toLocaleString('uk-UA', {timeZone: 'UTC'});
                    return `⏰ ${time} — ${a.client?.name ?? '—'} — ${a.service?.name ?? '—'}`;
                });

                await ctx.reply(`<b>Розклад на сьогодні:</b>\n\n${lines.join('\n')}`, {
                    parse_mode: 'HTML',
                    reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole),
                });
            } catch {
                await ctx.reply('Помилка завантаження розкладу.');
            }
        });

        bot.command('today', async (ctx) => {
            await ctx.reply('Використовуйте кнопку 👨‍🔧 Розклад на сьогодні з меню.');
        });
    }
}
