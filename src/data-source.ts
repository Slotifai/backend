import 'reflect-metadata';
import {DataSource} from 'typeorm';
import * as dotenv from 'dotenv';
import {Service} from './common/entities/service.entity';
import {Client} from './common/entities/client.entity';
import {Appointment} from './common/entities/appointment.entity';
import {Master} from './common/entities/master.entity';
import {WorkingHours} from './common/entities/working-hours.entity';
import {AppointmentNote} from './common/entities/appointment-note.entity';
import {Review} from './common/entities/review.entity';
import {User} from './common/entities/user.entity';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Service, Client, Appointment, Master, WorkingHours, AppointmentNote, Review, User],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
