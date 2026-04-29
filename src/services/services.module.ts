import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Service} from '../common/entities/service.entity';
import {Master} from '../common/entities/master.entity';
import {ServicesService} from './services.service';
import {ServicesController} from './services.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Service, Master])],
    providers: [ServicesService],
    controllers: [ServicesController],
})
export class ServicesModule {
}
