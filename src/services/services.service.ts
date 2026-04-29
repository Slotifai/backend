import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Service} from '../common/entities/service.entity';
import {Master} from '../common/entities/master.entity';
import {CreateServiceDto} from './dto/create-service.dto';
import {UpdateServiceDto} from './dto/update-service.dto';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(Master)
        private readonly masterRepository: Repository<Master>,
    ) {
    }

    private async getMasterByUserId(userId: number): Promise<Master> {
        const master = await this.masterRepository.findOne({where: {user: {id: userId}}});
        if (!master) throw new NotFoundException('Master profile not found');
        return master;
    }

    async createService(userId: number, dto: CreateServiceDto): Promise<Service> {
        const master = await this.getMasterByUserId(userId);
        const service = this.serviceRepository.create({...dto, masterId: master.id});
        return this.serviceRepository.save(service);
    }

    async getMyServices(userId: number): Promise<Service[]> {
        const master = await this.getMasterByUserId(userId);
        return this.serviceRepository.find({where: {masterId: master.id}, order: {createdAt: 'ASC'}});
    }

    async updateService(userId: number, serviceId: number, dto: UpdateServiceDto): Promise<Service> {
        const master = await this.getMasterByUserId(userId);
        const service = await this.serviceRepository.findOne({where: {id: serviceId}});
        if (!service) throw new NotFoundException('Service not found');
        if (service.masterId !== master.id) throw new ForbiddenException('This service does not belong to you');

        Object.assign(service, dto);
        return this.serviceRepository.save(service);
    }

    async deleteService(userId: number, serviceId: number): Promise<void> {
        const master = await this.getMasterByUserId(userId);
        const service = await this.serviceRepository.findOne({where: {id: serviceId}});
        if (!service) throw new NotFoundException('Service not found');
        if (service.masterId !== master.id) throw new ForbiddenException('This service does not belong to you');

        await this.serviceRepository.remove(service);
    }

    async getMasterServices(masterId: number): Promise<Service[]> {
        const master = await this.masterRepository.findOne({where: {id: masterId}});
        if (!master) throw new NotFoundException('Master not found');
        return this.serviceRepository.find({where: {masterId}, order: {createdAt: 'ASC'}});
    }
}
