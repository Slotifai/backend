import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from '../common/entities/user.entity';
import {Appointment} from '../common/entities/appointment.entity';
import {Master} from '../common/entities/master.entity';
import {Client} from '../common/entities/client.entity';
import {UserRole} from '../common/enums/user-role';
import {AppointmentStatus} from '../common/entities/appointmentStatus';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Master)
        private readonly masterRepository: Repository<Master>,
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) {
    }

    async getUsers(page = 1, limit = 20, role?: UserRole, search?: string) {
        const qb = this.userRepository.createQueryBuilder('u')
            .leftJoinAndSelect('u.client', 'client')
            .leftJoinAndSelect('u.master', 'master');
        if (role) qb.andWhere('u.role = :role', {role});
        if (search) qb.andWhere('(u.email ILIKE :search OR client.name ILIKE :search OR master.name ILIKE :search)', {search: `%${search}%`});

        const [data, total] = await qb
            .orderBy('u.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {data, total, page, limit};
    }

    async blockUser(userId: number, block: boolean): Promise<{ isBlocked: boolean }> {
        const user = await this.userRepository.findOne({where: {id: userId}});
        if (!user) throw new NotFoundException('User not found');
        await this.userRepository.update(userId, {isBlocked: block});
        return {isBlocked: block};
    }

    async deleteUser(userId: number): Promise<void> {
        const user = await this.userRepository.findOne({where: {id: userId}});
        if (!user) throw new NotFoundException('User not found');
        const client = await this.clientRepository.findOne({where: {user: {id: userId}}});
        const master = await this.masterRepository.findOne({where: {user: {id: userId}}});
        if (client) await this.appointmentRepository.delete({clientId: client.id});
        if (master) await this.appointmentRepository.delete({masterId: master.id});
        if (client) await this.clientRepository.delete({id: client.id});
        if (master) await this.masterRepository.delete({id: master.id});
        await this.userRepository.remove(user);
    }

    async getMasters(page = 1, limit = 20) {
        const [data, total] = await this.masterRepository.findAndCount({
            relations: {user: true},
            order: {createdAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });
        return {data, total, page, limit};
    }

    async getAppointments(page = 1, limit = 20, status?: AppointmentStatus, date?: string, masterId?: number) {
        const qb = this.appointmentRepository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.client', 'client')
            .leftJoinAndSelect('a.master', 'master')
            .leftJoinAndSelect('a.service', 'service');

        if (status) qb.andWhere('a.status = :status', {status});
        if (masterId) qb.andWhere('a.masterId = :masterId', {masterId});
        if (date) {
            const start = new Date(`${date}T00:00:00.000Z`);
            const end = new Date(`${date}T23:59:59.999Z`);
            qb.andWhere('a.startTime BETWEEN :start AND :end', {start, end});
        }

        const [data, total] = await qb
            .orderBy('a.startTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {data, total, page, limit};
    }

    async getStats() {
        const totalUsers = await this.userRepository.count();
        const totalMasters = await this.userRepository.count({where: {role: UserRole.MASTER}});
        const totalClients = await this.userRepository.count({where: {role: UserRole.CLIENT}});

        const appointmentCounts = await this.appointmentRepository
            .createQueryBuilder('a')
            .select('a.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('a.status')
            .getRawMany<{ status: AppointmentStatus; count: string }>();

        const appointments = Object.fromEntries(
            appointmentCounts.map(({status, count}) => [status, parseInt(count)]),
        );

        return {totalUsers, totalMasters, totalClients, appointments};
    }
}
