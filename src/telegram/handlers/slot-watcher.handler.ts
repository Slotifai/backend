import {Injectable, Logger} from '@nestjs/common';
import {Bot} from 'grammy';
import {Cron} from '@nestjs/schedule';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {BotContext} from '../telegram-bot.service';
import {SlotWatcher} from '../entities/slot-watcher.entity';
import {MastersService} from '../../masters/masters.service';
import {TelegramNotifyService} from '../telegram-notify.service';

@Injectable()
export class SlotWatcherHandler {
    private readonly logger = new Logger(SlotWatcherHandler.name);

    constructor(
        @InjectRepository(SlotWatcher)
        private readonly watcherRepository: Repository<SlotWatcher>,
        private readonly mastersService: MastersService,
        private readonly notifyService: TelegramNotifyService,
    ) {
    }

    register(bot: Bot<BotContext>): void {
        bot.callbackQuery(/^watch_slot:(\d+):(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            const masterId = parseInt(ctx.match[1], 10);
            const serviceId = parseInt(ctx.match[2], 10);
            const chatId = String(ctx.chat?.id ?? ctx.from?.id);

            try {
                const existing = await this.watcherRepository.findOne({
                    where: {chatId, masterId, serviceId},
                });
                if (!existing) {
                    await this.watcherRepository.save({
                        chatId,
                        userId: ctx.session.linkedUserId ?? null,
                        masterId,
                        serviceId,
                    });
                    await ctx.reply('🔔 Ви підписані на сповіщення про відкриття слотів!');
                } else {
                    await ctx.reply('Ви вже підписані на цього майстра та послугу.');
                }
            } catch {
                await ctx.reply('Помилка при підписці на слоти.');
            }
        });
    }

    @Cron('*/30 * * * *')
    async checkSlots(): Promise<void> {
        try {
            const watchers = await this.watcherRepository.find({
                relations: {master: true, service: true},
            });

            const pairs = new Map<string, SlotWatcher[]>();
            for (const w of watchers) {
                const key = `${w.masterId}:${w.serviceId}`;
                if (!pairs.has(key)) pairs.set(key, []);
                pairs.get(key)!.push(w);
            }

            for (const [, groupWatchers] of pairs) {
                const {masterId, serviceId} = groupWatchers[0];
                let hasSlots = false;

                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setUTCDate(date.getUTCDate() + i);
                    const dateStr = date.toISOString().slice(0, 10);
                    try {
                        const {slots} = await this.mastersService.getAvailability(masterId, dateStr, serviceId);
                        if (slots.length > 0) {
                            hasSlots = true;
                            break;
                        }
                    } catch {
                        // skip
                    }
                }

                if (hasSlots) {
                    const masterName = groupWatchers[0].master?.name ?? 'Майстер';
                    const serviceName = groupWatchers[0].service?.name ?? 'Послуга';
                    const toDelete: number[] = [];

                    for (const w of groupWatchers) {
                        await this.notifyService.sendMessage(
                            w.chatId,
                            `🟢 <b>З'явилися вільні слоти!</b>\nМайстер: ${masterName}\nПослуга: ${serviceName}`,
                        );
                        toDelete.push(w.id);
                    }

                    if (toDelete.length) {
                        await this.watcherRepository.delete(toDelete);
                    }
                }
            }
        } catch (err) {
            this.logger.error(`Slot watcher cron error: ${String(err)}`);
        }
    }
}
