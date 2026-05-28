import {forwardRef, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TelegramSession} from './entities/telegram-session.entity';
import {FavoriteMaster} from './entities/favorite-master.entity';
import {SlotWatcher} from './entities/slot-watcher.entity';
import {User} from '../common/entities/user.entity';
import {TelegramSessionService} from './telegram-session.service';
import {TelegramLinkService} from './telegram-link.service';
import {TelegramBotService} from './telegram-bot.service';
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
import {AppointmentsModule} from '../appointments/appointments.module';
import {MastersModule} from '../masters/masters.module';
import {ReviewsModule} from '../reviews/reviews.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TelegramSession, FavoriteMaster, SlotWatcher, User]),
        forwardRef(() => AppointmentsModule),
        MastersModule,
        ReviewsModule,
    ],
    providers: [
        TelegramSessionService,
        TelegramLinkService,
        TelegramNotifyService,
        TelegramBotService,
        StartHandler,
        BookingHandler,
        MyAppointmentsHandler,
        HistoryHandler,
        RebookHandler,
        FavoritesHandler,
        SlotWatcherHandler,
        MasterTodayHandler,
        MasterWeekHandler,
        ReviewHandler,
    ],
    exports: [TelegramNotifyService, TelegramLinkService],
})
export class TelegramModule {
}
