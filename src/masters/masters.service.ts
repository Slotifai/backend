import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ILike, Repository} from 'typeorm';
import {Master} from '../common/entities/master.entity';
import {WorkingHours} from '../common/entities/working-hours.entity';
import {Appointment} from '../common/entities/appointment.entity';
import {Service} from '../common/entities/service.entity';
import {AppointmentStatus} from '../common/entities/appointmentStatus';
import {UpdateMasterDto} from './dto/update-master.dto';
import {SetWorkingHoursDto} from './dto/set-working-hours.dto';
import {QueryMastersDto} from './dto/query-masters.dto';

@Injectable()
export class MastersService {
    constructor(
        @InjectRepository(Master)
        private readonly masterRepository: Repository<Master>,
        @InjectRepository(WorkingHours)
        private readonly workingHoursRepository: Repository<WorkingHours>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
    ) {
    }

    async getMyProfile(userId: number): Promise<Master> {
        const master = await this.masterRepository.findOne({
            where: {user: {id: userId}},
            relations: {workingHours: true, services: true},
        });
        if (!master) throw new NotFoundException('Master profile not found');
        return master;
    }

    async updateMyProfile(userId: number, dto: UpdateMasterDto): Promise<Master> {
        const master = await this.masterRepository.findOne({
            where: {user: {id: userId}},
        });
        if (!master) throw new NotFoundException('Master profile not found');

        Object.assign(master, dto);
        return this.masterRepository.save(master);
    }

    async getWorkingHours(userId: number): Promise<WorkingHours[]> {
        const master = await this.masterRepository.findOne({
            where: {user: {id: userId}},
        });
        if (!master) throw new NotFoundException('Master profile not found');

        return this.workingHoursRepository.find({
            where: {masterId: master.id},
            order: {dayOfWeek: 'ASC'},
        });
    }

    async setWorkingHours(userId: number, dto: SetWorkingHoursDto): Promise<WorkingHours[]> {
        const master = await this.masterRepository.findOne({
            where: {user: {id: userId}},
        });
        if (!master) throw new NotFoundException('Master profile not found');

        await this.workingHoursRepository.delete({masterId: master.id});

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

    async getPublicProfile(masterId: number): Promise<Master & { rating: number; reviewCount: number; minPrice: number | null }> {
        const master = await this.masterRepository.findOne({
            where: {id: masterId},
            relations: {workingHours: true, services: true},
        });
        if (!master) throw new NotFoundException('Master not found');
        const stats = await this.getMasterStats([masterId]);
        return {...master, ...(stats.get(masterId) ?? {rating: 0, reviewCount: 0, minPrice: null})};
    }

    async getAvailability(masterId: number, date: string, serviceId: number): Promise<{ slots: string[] }> {
        const master = await this.masterRepository.findOne({where: {id: masterId}});
        if (!master) throw new NotFoundException('Master not found');

        const service = await this.serviceRepository.findOne({where: {id: serviceId}});
        if (!service) throw new NotFoundException('Service not found');
        if (service.masterId !== masterId) throw new BadRequestException('Service does not belong to this master');

        const dateObj = new Date(`${date}T00:00:00.000Z`);
        if (isNaN(dateObj.getTime())) throw new BadRequestException('Invalid date format, use YYYY-MM-DD');

        const dayOfWeek = dateObj.getUTCDay();
        const workingHours = await this.workingHoursRepository.findOne({where: {masterId, dayOfWeek}});

        if (!workingHours || workingHours.isDayOff) return {slots: []};

        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        const workStart = toMinutes(workingHours.startTime);
        const workEnd = toMinutes(workingHours.endTime);
        const duration = service.durationMinutes;

        const dayStart = new Date(`${date}T00:00:00.000Z`);
        const dayEnd = new Date(`${date}T23:59:59.999Z`);

        const booked = await this.appointmentRepository
            .createQueryBuilder('a')
            .where('a.masterId = :masterId', {masterId})
            .andWhere('a.status != :cancelled', {cancelled: AppointmentStatus.CANCELLED})
            .andWhere('a.startTime < :dayEnd', {dayEnd})
            .andWhere('a.endTime > :dayStart', {dayStart})
            .getMany();

        const slots: string[] = [];
        for (let start = workStart; start + duration <= workEnd; start += 30) {
            const slotEnd = start + duration;
            const slotStartDate = new Date(`${date}T${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}:00.000Z`);
            const slotEndDate = new Date(slotStartDate.getTime() + duration * 60 * 1000);

            const overlap = booked.some(
                (a) => a.startTime < slotEndDate && a.endTime > slotStartDate,
            );

            if (!overlap) {
                slots.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
            }

            void slotEnd;
        }

        return {slots};
    }

    async findAll(query: QueryMastersDto): Promise<{ data: (Master & { rating: number; reviewCount: number; minPrice: number | null })[]; total: number; page: number; limit: number }> {
        const {search, specialization, page = 1, limit = 20} = query;

        const where: Record<string, unknown> = {};
        if (search) where.name = ILike(`%${search}%`);
        if (specialization) where.specialization = ILike(`%${specialization}%`);

        const [data, total] = await this.masterRepository.findAndCount({
            where,
            relations: {services: true},
            order: {createdAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });

        const ids = data.map(m => m.id);
        const statsMap = ids.length ? await this.getMasterStats(ids) : new Map();

        return {
            data: data.map(m => ({...m, ...(statsMap.get(m.id) ?? {rating: 0, reviewCount: 0, minPrice: null})})),
            total,
            page,
            limit,
        };
    }

    private async getMasterStats(masterIds: number[]): Promise<Map<number, { rating: number; reviewCount: number; minPrice: number | null }>> {
        if (!masterIds.length) return new Map();

        const ratings = await this.appointmentRepository
            .createQueryBuilder('a')
            .innerJoin('a.reviews', 'r')
            .select('a.masterId', 'masterId')
            .addSelect('AVG(r.rating)', 'avg')
            .addSelect('COUNT(r.id)', 'cnt')
            .where('a.masterId IN (:...ids)', {ids: masterIds})
            .groupBy('a.masterId')
            .getRawMany<{ masterId: number; avg: string; cnt: string }>();

        const prices = await this.serviceRepository
            .createQueryBuilder('s')
            .select('s.masterId', 'masterId')
            .addSelect('MIN(s.price)', 'minPrice')
            .where('s.masterId IN (:...ids)', {ids: masterIds})
            .groupBy('s.masterId')
            .getRawMany<{ masterId: number; minPrice: string }>();

        const map = new Map<number, { rating: number; reviewCount: number; minPrice: number | null }>();
        for (const id of masterIds) {
            const r = ratings.find(x => Number(x.masterId) === id);
            const p = prices.find(x => Number(x.masterId) === id);
            map.set(id, {
                rating: r ? parseFloat(parseFloat(r.avg).toFixed(2)) : 0,
                reviewCount: r ? parseInt(r.cnt) : 0,
                minPrice: p ? parseFloat(p.minPrice) : null,
            });
        }
        return map;
    }
}
