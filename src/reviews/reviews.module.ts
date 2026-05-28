import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Review} from '../common/entities/review.entity';
import {Appointment} from '../common/entities/appointment.entity';
import {Client} from '../common/entities/client.entity';
import {ReviewsService} from './reviews.service';
import {ReviewsController} from './reviews.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Review, Appointment, Client])],
    providers: [ReviewsService],
    controllers: [ReviewsController],
    exports: [ReviewsService],
})
export class ReviewsModule {
}
