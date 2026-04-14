import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './common/entities/service.entity';
import { Client } from './common/entities/client.entity';
import { Appointment } from './common/entities/appointment.entity';
import { Master } from './common/entities/master.entity';
import { WorkingHours } from './common/entities/working-hours.entity';
import { AppointmentNote } from './common/entities/appointment-note.entity';
import { Review } from './common/entities/review.entity';
import { User } from './common/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Service, Client, Appointment, Master, WorkingHours, AppointmentNote, Review, User],
      synchronize: true,
    }),
    AuthModule,
    MastersModule,
    ClientsModule,
  ],
})
export class AppModule {}
