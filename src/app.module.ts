import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ThrottlerModule} from '@nestjs/throttler';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Service} from './common/entities/service.entity';
import {Client} from './common/entities/client.entity';
import {Appointment} from './common/entities/appointment.entity';
import {Master} from './common/entities/master.entity';
import {WorkingHours} from './common/entities/working-hours.entity';
import {AppointmentNote} from './common/entities/appointment-note.entity';
import {Review} from './common/entities/review.entity';
import {User} from './common/entities/user.entity';
import {AuthModule} from './auth/auth.module';
import {MastersModule} from './masters/masters.module';
import {ClientsModule} from './clients/clients.module';
import {AppointmentsModule} from './appointments/appointments.module';
import {ServicesModule} from './services/services.module';
import {ReviewsModule} from './reviews/reviews.module';
import {AdminModule} from './admin/admin.module';
import {ScheduleModule} from '@nestjs/schedule';
import {NotificationsModule} from './notifications/notifications.module';
import {AiModule} from './ai/ai.module';
import {TelegramModule} from './telegram/telegram.module';
import {TelegramSession} from './telegram/entities/telegram-session.entity';
import {FavoriteMaster} from './telegram/entities/favorite-master.entity';
import {SlotWatcher} from './telegram/entities/slot-watcher.entity';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        ThrottlerModule.forRoot([{ttl: 60000, limit: 100}]),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [Service, Client, Appointment, Master, WorkingHours, AppointmentNote, Review, User, TelegramSession, FavoriteMaster, SlotWatcher],
            migrations: ['dist/migrations/*.js'],
            synchronize: false,
        }),
        AuthModule,
        MastersModule,
        ClientsModule,
        AppointmentsModule,
        ServicesModule,
        ReviewsModule,
        AdminModule,
        NotificationsModule,
        AiModule,
        TelegramModule,
    ],
})
export class AppModule {
}
