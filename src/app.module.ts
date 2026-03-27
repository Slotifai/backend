import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Client } from './entities/client.entity';
import { Appointment } from './entities/appointment.entity';
import { Master } from './entities/master.entity';
import { WorkingHours } from './entities/working-hours.entity';
import { AppointmentNote } from './entities/appointment-note.entity';
import { Review } from './entities/review.entity';

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
      entities: [Service, Client, Appointment, Master, WorkingHours, AppointmentNote, Review],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
