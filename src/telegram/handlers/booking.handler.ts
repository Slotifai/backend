import {Injectable} from '@nestjs/common';
import {Bot} from 'grammy';
import {BotContext} from '../telegram-bot.service';
import {MastersService} from '../../masters/masters.service';
import {AppointmentsService} from '../../appointments/appointments.service';
import {mainMenuKeyboard} from './start.handler';

const PAGE_SIZE = 5;

@Injectable()
export class BookingHandler {
    constructor(
        private readonly mastersService: MastersService,
        private readonly appointmentsService: AppointmentsService,
    ) {
    }

    register(bot: Bot<BotContext>): void {
        bot.hears('📅 Записатися', async (ctx) => {
            try {
                ctx.session.step = 'AWAITING_BOOKING_TYPE';
                ctx.session.masterPage = 0;
                await ctx.reply('Як ви хочете записатися?', {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '👤 До конкретного майстра', callback_data: 'book_type:specific'}],
                            [{text: '🔍 До найближчого вільного', callback_data: 'book_type:nearest'}],
                            [{text: '❌ Скасувати', callback_data: 'book_cancel'}],
                        ],
                    },
                });
            } catch {
                await ctx.reply('Сталася помилка.');
            }
        });

        bot.callbackQuery('book_cancel', async (ctx) => {
            await ctx.answerCallbackQuery();
            ctx.session.step = 'IDLE';
            await ctx.reply('Запис скасовано.', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
        });

        bot.callbackQuery(/^book_type:(.+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            const type = ctx.match[1];

            if (type === 'specific') {
                ctx.session.step = 'AWAITING_MASTER_SELECT';
                ctx.session.masterPage = 0;
                await this.showMasterList(ctx);
            } else {
                ctx.session.step = 'AWAITING_MASTER_SELECT';
                ctx.session.masterPage = 0;
                await this.showSpecializationChoice(ctx);
            }
        });

        bot.callbackQuery(/^master_page:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            ctx.session.masterPage = parseInt(ctx.match[1], 10);
            await this.showMasterList(ctx);
        });

        bot.callbackQuery('spec_skip', async (ctx) => {
            await ctx.answerCallbackQuery();
            ctx.session.step = 'AWAITING_MASTER_SELECT';
            ctx.session.masterPage = 0;
            await this.showMasterList(ctx);
        });

        bot.callbackQuery(/^spec:(.+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            const specialization = ctx.match[1] === '_any' ? undefined : ctx.match[1];
            ctx.session.step = 'AWAITING_MASTER_SELECT';
            ctx.session.masterPage = 0;
            await this.showMasterList(ctx, specialization);
        });

        bot.callbackQuery(/^master:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            const masterId = parseInt(ctx.match[1], 10);
            ctx.session.selectedMasterId = masterId;
            ctx.session.step = 'AWAITING_SERVICE_SELECT';
            await this.showServiceList(ctx, masterId);
        });

        bot.callbackQuery(/^service:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            const serviceId = parseInt(ctx.match[1], 10);
            ctx.session.selectedServiceId = serviceId;
            ctx.session.step = 'AWAITING_SLOT_SELECT';
            await this.showSlotList(ctx);
        });

        bot.callbackQuery(/^slot_day:(\d+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            await this.showSlotList(ctx, parseInt(ctx.match[1], 10));
        });

        bot.callbackQuery(/^slot:(.+)$/, async (ctx) => {
            await ctx.answerCallbackQuery();
            ctx.session.selectedSlot = ctx.match[1];
            ctx.session.step = 'AWAITING_CONFIRM';
            await this.showConfirmation(ctx);
        });

        bot.callbackQuery('book_confirm', async (ctx) => {
            await ctx.answerCallbackQuery();

            if (ctx.session.linkedUserId) {
                await this.createBookingForLinkedUser(ctx);
            } else {
                ctx.session.step = 'AWAITING_GUEST_NAME';
                await ctx.reply('Введіть ваше ім\'я:');
            }
        });

        bot.on('message:text', async (ctx, next) => {
            const text = ctx.message.text;
            if (text.startsWith('/') || text.startsWith('📅') || text.startsWith('📋') ||
                text.startsWith('📜') || text.startsWith('⭐') || text.startsWith('👨') ||
                text.startsWith('📆') || text.startsWith('🏠')) {
                return next();
            }

            const step = ctx.session.step;

            if (step === 'AWAITING_GUEST_NAME') {
                ctx.session.guestName = text;
                ctx.session.step = 'AWAITING_GUEST_PHONE';
                await ctx.reply('Введіть ваш номер телефону:');
            } else if (step === 'AWAITING_GUEST_PHONE') {
                ctx.session.guestPhone = text;
                await this.createBookingForGuest(ctx);
            }
        });
    }

    private async showSpecializationChoice(ctx: BotContext): Promise<void> {
        try {
            const specs = await this.mastersService.getDistinctSpecializations();
            const buttons = specs.map((s) => [{text: s, callback_data: `spec:${s}`}]);
            buttons.push([{text: '🔍 Будь-яка спеціалізація', callback_data: 'spec:_any'}]);
            buttons.push([{text: '❌ Скасувати', callback_data: 'book_cancel'}]);
            await ctx.reply('Оберіть спеціалізацію:', {reply_markup: {inline_keyboard: buttons}});
        } catch {
            await ctx.reply('Помилка завантаження спеціалізацій.');
        }
    }

    private async showMasterList(ctx: BotContext, specialization?: string): Promise<void> {
        try {
            const page = (ctx.session.masterPage ?? 0) + 1;
            const result = await this.mastersService.findAll({
                page,
                limit: PAGE_SIZE,
                specialization: specialization ?? undefined,
            });

            if (result.data.length === 0) {
                await ctx.reply('Майстрів не знайдено.', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
                ctx.session.step = 'IDLE';
                return;
            }

            const buttons = result.data.map((m) => [
                {text: `${m.name}${m.specialization ? ` — ${m.specialization}` : ''}`, callback_data: `master:${m.id}`},
            ]);

            const nav: {text: string; callback_data: string}[] = [];
            const currentPage = ctx.session.masterPage ?? 0;
            if (currentPage > 0) nav.push({text: '⬅️', callback_data: `master_page:${currentPage - 1}`});
            if (result.total > page * PAGE_SIZE) nav.push({text: '➡️', callback_data: `master_page:${currentPage + 1}`});
            if (nav.length) buttons.push(nav);
            buttons.push([{text: '❌ Скасувати', callback_data: 'book_cancel'}]);

            await ctx.reply(`Оберіть майстра (стор. ${page}):`, {
                reply_markup: {inline_keyboard: buttons},
            });
        } catch {
            await ctx.reply('Помилка завантаження майстрів.');
        }
    }

    private async showServiceList(ctx: BotContext, masterId: number): Promise<void> {
        try {
            const master = await this.mastersService.getPublicProfile(masterId);
            if (!master.services?.length) {
                await ctx.reply('У цього майстра немає доступних послуг.');
                ctx.session.step = 'IDLE';
                return;
            }

            const buttons = master.services.map((s) => [
                {text: `${s.name} — ${s.durationMinutes} хв. — ${s.price} ₴`, callback_data: `service:${s.id}`},
            ]);
            buttons.push([{text: '❌ Скасувати', callback_data: 'book_cancel'}]);

            await ctx.reply(`Майстер: <b>${master.name}</b>\nОберіть послугу:`, {
                parse_mode: 'HTML',
                reply_markup: {inline_keyboard: buttons},
            });
        } catch {
            await ctx.reply('Помилка завантаження послуг.');
        }
    }

    private async showSlotList(ctx: BotContext, dayOffset = 0): Promise<void> {
        try {
            const masterId = ctx.session.selectedMasterId!;
            const serviceId = ctx.session.selectedServiceId!;

            const buttons: {text: string; callback_data: string}[][] = [];
            let found = false;

            for (let i = dayOffset; i < dayOffset + 7 && buttons.length < 20; i++) {
                const date = new Date();
                date.setUTCDate(date.getUTCDate() + i);
                const dateStr = date.toISOString().slice(0, 10);
                const {slots} = await this.mastersService.getAvailability(masterId, dateStr, serviceId);

                for (const slot of slots) {
                    const iso = `${dateStr}T${slot}:00.000Z`;
                    const label = `${dateStr.slice(8, 10)}.${dateStr.slice(5, 7)} ${slot}`;
                    buttons.push([{text: label, callback_data: `slot:${iso}`}]);
                    found = true;
                    if (buttons.length >= 20) break;
                }
            }

            if (!found) {
                const navButtons: {text: string; callback_data: string}[] = [
                    {text: '➡️ Наступні 7 днів', callback_data: `slot_day:${dayOffset + 7}`},
                    {text: '❌ Скасувати', callback_data: 'book_cancel'},
                ];
                await ctx.reply('Немає вільних слотів на найближчі 7 днів.', {
                    reply_markup: {inline_keyboard: [navButtons]},
                });
                return;
            }

            if (dayOffset + 7 < 90) {
                buttons.push([{text: '➡️ Ще', callback_data: `slot_day:${dayOffset + 7}`}]);
            }
            buttons.push([{text: '❌ Скасувати', callback_data: 'book_cancel'}]);

            await ctx.reply('Оберіть час запису:', {
                reply_markup: {inline_keyboard: buttons},
            });
        } catch {
            await ctx.reply('Помилка завантаження слотів.');
        }
    }

    private async showConfirmation(ctx: BotContext): Promise<void> {
        try {
            const masterId = ctx.session.selectedMasterId!;
            const serviceId = ctx.session.selectedServiceId!;
            const slotIso = ctx.session.selectedSlot!;

            const master = await this.mastersService.getPublicProfile(masterId);
            const service = master.services?.find((s) => s.id === serviceId);
            const time = new Date(slotIso).toLocaleString('uk-UA', {timeZone: 'UTC'});

            await ctx.reply(
                `✅ <b>Підтвердіть запис</b>\n\n` +
                `👨‍🔧 Майстер: ${master.name}\n` +
                `💈 Послуга: ${service?.name ?? '—'}\n` +
                `⏱ Тривалість: ${service?.durationMinutes ?? '—'} хв.\n` +
                `💰 Ціна: ${service?.price ?? '—'} ₴\n` +
                `📅 Час: ${time}`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '✅ Підтвердити', callback_data: 'book_confirm'}],
                            [{text: '❌ Скасувати', callback_data: 'book_cancel'}],
                        ],
                    },
                },
            );
        } catch {
            await ctx.reply('Помилка при підтвердженні.');
        }
    }

    private async createBookingForLinkedUser(ctx: BotContext): Promise<void> {
        try {
            await this.appointmentsService.createAppointment(ctx.session.linkedUserId!, {
                masterId: ctx.session.selectedMasterId!,
                serviceId: ctx.session.selectedServiceId!,
                startTime: ctx.session.selectedSlot!,
            });
            ctx.session.step = 'IDLE';
            await ctx.reply('🎉 Запис успішно створено!', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
        } catch (err) {
            await ctx.reply(`❌ Не вдалося створити запис: ${err instanceof Error ? err.message : 'Помилка'}`);
        }
    }

    private async createBookingForGuest(ctx: BotContext): Promise<void> {
        try {
            await this.appointmentsService.createAppointmentAsGuest(
                {
                    name: ctx.session.guestName!,
                    phone: ctx.session.guestPhone!,
                },
                {
                    masterId: ctx.session.selectedMasterId!,
                    serviceId: ctx.session.selectedServiceId!,
                    startTime: ctx.session.selectedSlot!,
                },
            );
            ctx.session.step = 'IDLE';
            await ctx.reply('🎉 Запис успішно створено!', {reply_markup: mainMenuKeyboard(ctx.session.linkedUserRole)});
        } catch (err) {
            await ctx.reply(`❌ Не вдалося створити запис: ${err instanceof Error ? err.message : 'Помилка'}`);
        }
    }
}
