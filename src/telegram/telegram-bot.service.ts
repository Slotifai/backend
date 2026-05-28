import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {Bot, session} from 'grammy';
import {ConfigService} from '@nestjs/config';
import {BookingSessionData} from './dto/booking-state.dto';
import {BotContext} from './telegram.types';
import {TelegramSessionService} from './telegram-session.service';
import {TelegramNotifyService} from './telegram-notify.service';
import {StartHandler} from './handlers/start.handler';
import {BookingHandler} from './handlers/booking.handler';
import {MyAppointmentsHandler} from './handlers/my-appointments.handler';
import {HistoryHandler} from './handlers/history.handler';
import {RebookHandler} from './handlers/rebook.handler';
import {FavoritesHandler} from './handlers/favorites.handler';
import {SlotWatcherHandler} from './handlers/slot-watcher.handler';
import {MasterTodayHandler} from './handlers/master-today.handler';
import {MasterWeekHandler} from './handlers/master-week.handler';
import {ReviewHandler} from './handlers/review.handler';

export type {BotContext} from './telegram.types';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TelegramBotService.name);
    private bot: Bot<BotContext>;

    constructor(
        private readonly config: ConfigService,
        private readonly sessionService: TelegramSessionService,
        private readonly notifyService: TelegramNotifyService,
        private readonly startHandler: StartHandler,
        private readonly bookingHandler: BookingHandler,
        private readonly myAppointmentsHandler: MyAppointmentsHandler,
        private readonly historyHandler: HistoryHandler,
        private readonly rebookHandler: RebookHandler,
        private readonly favoritesHandler: FavoritesHandler,
        private readonly slotWatcherHandler: SlotWatcherHandler,
        private readonly masterTodayHandler: MasterTodayHandler,
        private readonly masterWeekHandler: MasterWeekHandler,
        private readonly reviewHandler: ReviewHandler,
    ) {
        const token = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
        this.bot = new Bot<BotContext>(token);
    }

    onModuleInit(): void {
        this.setupBot();
        this.notifyService.setBot(this.bot);

        this.bot.start({
            onStart: (info) => this.logger.log(`Bot @${info.username} started polling`),
        }).catch((err) => this.logger.error(`Bot polling error: ${String(err)}`));
    }

    onModuleDestroy(): void {
        void this.bot.stop();
    }

    getBot(): Bot<BotContext> {
        return this.bot;
    }

    private setupBot(): void {
        // Session middleware with DB adapter
        this.bot.use(
            session({
                initial: (): BookingSessionData => ({step: 'IDLE', linkedUserId: null}),
                storage: this.sessionService,
            }),
        );

        // Restore linkedUserId from DB on each update if not set
        this.bot.use(async (ctx, next) => {
            if (!ctx.session.linkedUserId && ctx.from) {
                const chatId = String(ctx.chat?.id ?? ctx.from.id);
                // Restore from session data (already done via storage adapter)
                void chatId;
            }
            return next();
        });

        // Register all handlers
        this.registerHandlers();

        // Global error handler
        this.bot.catch((err) => {
            this.logger.error(`Bot error: ${String(err)}`);
        });
    }

    private registerHandlers(): void {
        // Order matters: more specific handlers first
        this.startHandler.register(this.bot);
        this.reviewHandler.register(this.bot);   // before text handler in booking
        this.bookingHandler.register(this.bot);
        this.myAppointmentsHandler.register(this.bot);
        this.historyHandler.register(this.bot);
        this.rebookHandler.register(this.bot);
        this.favoritesHandler.register(this.bot);
        this.slotWatcherHandler.register(this.bot);
        this.masterTodayHandler.register(this.bot);
        this.masterWeekHandler.register(this.bot);
    }
}
