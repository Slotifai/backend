import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Master } from '../common/entities/master.entity';
import { WorkingHours } from '../common/entities/working-hours.entity';
import { UpdateMasterDto } from './dto/update-master.dto';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(Master)
    private readonly masterRepository: Repository<Master>,
    @InjectRepository(WorkingHours)
    private readonly workingHoursRepository: Repository<WorkingHours>,
  ) {}

  async getMyProfile(userId: number): Promise<Master> {
    const master = await this.masterRepository.findOne({
      where: { user: { id: userId } },
      relations: { workingHours: true, services: true },
    });
    if (!master) throw new NotFoundException('Master profile not found');
    return master;
  }

  async updateMyProfile(userId: number, dto: UpdateMasterDto): Promise<Master> {
    const master = await this.masterRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!master) throw new NotFoundException('Master profile not found');

    Object.assign(master, dto);
    return this.masterRepository.save(master);
  }

  async getWorkingHours(userId: number): Promise<WorkingHours[]> {
    const master = await this.masterRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!master) throw new NotFoundException('Master profile not found');

    return this.workingHoursRepository.find({
      where: { masterId: master.id },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async setWorkingHours(userId: number, dto: SetWorkingHoursDto): Promise<WorkingHours[]> {
    const master = await this.masterRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!master) throw new NotFoundException('Master profile not found');

    await this.workingHoursRepository.delete({ masterId: master.id });

    const entries = dto.schedule.map((item) =>
      this.workingHoursRepository.create({
        masterId: master.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime ?? '09:00',
        endTime: item.endTime ?? '18:00',
        isDayOff: item.isDayOff ?? false,
      }),
    );

    return this.workingHoursRepository.save(entries);
  }

  async getPublicProfile(masterId: number): Promise<Master> {
    const master = await this.masterRepository.findOne({
      where: { id: masterId },
      relations: { workingHours: true, services: true },
    });
    if (!master) throw new NotFoundException('Master not found');
    return master;
  }
}
