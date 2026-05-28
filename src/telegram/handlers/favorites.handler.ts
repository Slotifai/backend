import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {BotContext} from '../telegram-bot.service';
import {FavoriteMaster} from '../entities/favorite-master.entity';
import {mainMenuKeyboard} from './start.handler';

@Injectable()
export class FavoritesHandler {
    constructor(
        @InjectRepository(FavoriteMaster)
        private readonly favoritesRepository: Repository<FavoriteMaster>,
    ) {
    }

    register(bot: Bot<BotContext>): void {
        bot.hears('⭐ Улюблені майстри', async (ctx) => {
            try {
                if (!ctx.session.linkedUserId) {
                    await ctx.reply('⚠️ Для перегляду улюблених необхідно прив\'язати акаунт.');
                    return;
                }

                const favorites = await this.favoritesRepository.find({
                    where: {userId: ctx.session.linkedUserId},
                    relations: {master: true},
                    order: {createdAt: 'DESC'},
                });

                if (!favorites.length) {
                    await ctx.reply('У вас немає улюблених майстрів.', {reply_markup: mainMenuKeyboard()});
                    return;
                }

                const buttons = favorites.map((f) => [
                    {text: `⭐ ${f.master?.name ?? '—'}`, callback_data: `master:${f.masterId}`},
                    {text: '🗑', callback_data: `unfav:${f.masterId}`},
                ]);
                buttons.push([{text: '🏠 Головне меню', callback_data: 'main_menu'}]);

                await ctx.reply('Ваші улюблені майстри:', {
                    reply_markup: {inline_keyboard: buttons},
                });
            } catch {
                await ctx.reply('Помилка завантаження улюблених.');
            }
        });

        bot.callbackQuery(/^fav:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            if (!ctx.session.linkedUserId) return;

            const masterId = parseInt(ctx.match[1], 10);
            try {
                const existing = await this.favoritesRepository.findOne({
                    where: {userId: ctx.session.linkedUserId, masterId},
                });
                if (!existing) {
                    await this.favoritesRepository.save({
                        userId: ctx.session.linkedUserId,
                        masterId,
                    });
                    await ctx.reply('⭐ Майстра додано до улюблених!');
                } else {
                    await ctx.reply('Майстер вже в улюблених.');
                }
            } catch {
                await ctx.reply('Помилка при додаванні до улюблених.');
            }
        });

        bot.callbackQuery(/^unfav:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            if (!ctx.session.linkedUserId) return;

            const masterId = parseInt(ctx.match[1], 10);
            try {
                await this.favoritesRepository.delete({
                    userId: ctx.session.linkedUserId,
                    masterId,
                });
                await ctx.reply('🗑 Майстра видалено з улюблених.');
            } catch {
                await ctx.reply('Помилка при видаленні з улюблених.');
            }
        });

        bot.callbackQuery('main_menu', async (ctx) => {
            await ctx.answerCallbackQuery();
            ctx.session.step = 'IDLE';
            await ctx.reply('Головне меню:', {reply_markup: mainMenuKeyboard()});
        });
    }
}
