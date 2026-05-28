import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {ReviewsService} from '../../reviews/reviews.service';
import {mainMenuKeyboard} from './start.handler';

@Injectable()
export class ReviewHandler {
    constructor(private readonly reviewsService: ReviewsService) {
    }

    register(bot: Bot<BotContext>): void {
        bot.callbackQuery(/^review_rate:(\d+):(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            const appointmentId = parseInt(ctx.match[1], 10);
            const rating = parseInt(ctx.match[2], 10);

            ctx.session.pendingReviewAppointmentId = appointmentId;
            ctx.session.pendingReviewRating = rating;
            ctx.session.step = 'AWAITING_REVIEW_COMMENT';

            await ctx.reply(
                `Ви обрали оцінку: ${'⭐'.repeat(rating)}\n\nЗалиште коментар (або натисніть "Пропустити"):`,
                {
                    reply_markup: {
                        inline_keyboard: [[{text: 'Пропустити', callback_data: 'review_skip'}]],
                    },
                },
            );
        });

        bot.callbackQuery('review_skip', async (ctx) => {
            await ctx.answerCallbackQuery();
            await this.submitReview(ctx, undefined);
        });

        bot.on('message:text', async (ctx, next) => {
            if (ctx.session.step !== 'AWAITING_REVIEW_COMMENT') {
                return next();
            }
            await this.submitReview(ctx, ctx.message.text);
        });
    }

    private async submitReview(ctx: BotContext, comment: string | undefined): Promise<void> {
        const appointmentId = ctx.session.pendingReviewAppointmentId;
        const rating = ctx.session.pendingReviewRating;

        if (!appointmentId || !rating) {
            ctx.session.step = 'IDLE';
            await ctx.reply('Помилка: дані відгуку втрачено.');
            return;
        }

        if (!ctx.session.linkedUserId) {
            ctx.session.step = 'IDLE';
            await ctx.reply('Для відгуку необхідно прив\'язати акаунт.');
            return;
        }

        try {
            await this.reviewsService.createReviewAsBot(
                ctx.session.linkedUserId,
                appointmentId,
                rating,
                comment,
            );
            ctx.session.step = 'IDLE';
            ctx.session.pendingReviewAppointmentId = undefined;
            ctx.session.pendingReviewRating = undefined;
            await ctx.reply(`✅ Відгук збережено! Дякуємо за оцінку ${'⭐'.repeat(rating)}`, {
                reply_markup: mainMenuKeyboard(),
            });
        } catch (err) {
            ctx.session.step = 'IDLE';
            await ctx.reply(`❌ Не вдалося зберегти відгук: ${err instanceof Error ? err.message : 'Помилка'}`);
        }
    }
}
