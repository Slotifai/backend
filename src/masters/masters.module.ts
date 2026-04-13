import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Master } from '../common/entities/master.entity';
import { WorkingHours } from '../common/entities/working-hours.entity';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Master, WorkingHours])],
  providers: [MastersService],
  controllers: [MastersController],
})
export class MastersModule {}
