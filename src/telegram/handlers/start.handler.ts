import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {TelegramLinkService} from '../telegram-link.service';

@Injectable()
export class StartHandler {
    constructor(private readonly linkService: TelegramLinkService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.command('start', async (ctx) => {
            try {
                const chatId = String(ctx.chat.id);
                const param = ctx.match?.trim();

                if (param) {
                    const user = await this.linkService.linkByToken(param, chatId);
                    if (user) {
                        ctx.session.linkedUserId = user.id;
                        ctx.session.linkedUserRole = user.role.toUpperCase() as 'CLIENT' | 'MASTER';
                        await ctx.reply(
                            '✅ Ваш акаунт успішно прив\'язано до Telegram!\n\nТепер ви можете керувати записами прямо тут.',
                            {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)},
                        );
                        return;
                    }
                    await ctx.reply('❌ Посилання недійсне або вже використане.');
                }

                const linked = await this.linkService.findUserByChatId(chatId);
                if (linked && !ctx.session.linkedUserId) {
                    ctx.session.linkedUserId = linked.id;
                    ctx.session.linkedUserRole = linked.role.toUpperCase() as 'CLIENT' | 'MASTER';
                }

                ctx.session.step = 'IDLE';
                await ctx.reply(
                    '👋 Ласкаво просимо до <b>Slotifai</b>!\n\nЯ допоможу вам записатися до майстра, керувати записами та залишати відгуки.',
                    {parse_mode: 'HTML', reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)},
                );
            } catch (err) {
                await ctx.reply('Сталася помилка. Спробуйте ще раз.');
            }
        });

        bot.command('cancel', async (ctx) => {
            ctx.session.step = 'IDLE';
            await ctx.reply('Дію скасовано.', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
        });

        bot.hears('🏠 Головне меню', async (ctx) => {
            ctx.session.step = 'IDLE';
            await ctx.reply('Головне меню:', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
        });
    }
}

export function mainMenuKeyboard(role?: 'CLIENT' | 'MASTER' | null) {
    const isMaster = role === 'MASTER';
    const keyboard: {text: string}[][] = [
        [{text: '📅 Записатися'}],
        [{text: '📋 Мої записи'}, {text: '📜 Історія'}],
        [{text: '⭐ Улюблені майстри'}],
    ];
    if (isMaster) {
        keyboard.push([{text: '👨‍🔧 Розклад на сьогодні'}, {text: '📆 Розклад на тиждень'}]);
    }
    return {keyboard, resize_keyboard: true};
}
