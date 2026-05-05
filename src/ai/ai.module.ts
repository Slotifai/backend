import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Master} from '../common/entities/master.entity';
import {Service} from '../common/entities/service.entity';
import {Review} from '../common/entities/review.entity';
import {AiService} from './ai.service';
import {AiController} from './ai.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Master, Service, Review])],
    providers: [AiService],
    controllers: [AiController],
})
export class AiModule {
}
