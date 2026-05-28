import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Review} from '../common/entities/review.entity';
import {Appointment} from '../common/entities/appointment.entity';
import {Client} from '../common/entities/client.entity';
import {AppointmentStatus} from '../common/entities/appointmentStatus';
import {CreateReviewDto} from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) {
    }

    async createReview(userId: number, appointmentId: number, dto: CreateReviewDto): Promise<Review> {
        const client = await this.clientRepository.findOne({where: {user: {id: userId}}});
        if (!client) throw new NotFoundException('Client profile not found');

        const appointment = await this.appointmentRepository.findOne({where: {id: appointmentId}});
        if (!appointment) throw new NotFoundException('Appointment not found');

        if (appointment.clientId !== client.id) {
            throw new ForbiddenException('This appointment does not belong to you');
        }

        if (appointment.status !== AppointmentStatus.COMPLETED) {
            throw new BadRequestException('You can only review completed appointments');
        }

        const existing = await this.reviewRepository.findOne({where: {appointmentId}});
        if (existing) throw new BadRequestException('You have already reviewed this appointment');

        const review = this.reviewRepository.create({...dto, clientId: client.id, appointmentId});
        return this.reviewRepository.save(review);
    }

    async getMasterReviews(masterId: number, page = 1, limit = 20): Promise<{
        data: Review[];
        total: number;
        average: number;
        page: number;
        limit: number
    }> {
        const [data, total] = await this.reviewRepository
            .createQueryBuilder('r')
            .innerJoin('r.appointment', 'a')
            .where('a.masterId = :masterId', {masterId})
            .leftJoinAndSelect('r.client', 'client')
            .orderBy('r.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const avgResult = await this.reviewRepository
            .createQueryBuilder('r')
            .innerJoin('r.appointment', 'a')
            .where('a.masterId = :masterId', {masterId})
            .select('AVG(r.rating)', 'avg')
            .getRawOne<{ avg: string }>();

        const average = avgResult?.avg ? parseFloat(parseFloat(avgResult.avg).toFixed(2)) : 0;

        return {data, total, average, page, limit};
    }

    async createReviewAsBot(clientId: number, appointmentId: number, rating: number, comment?: string): Promise<Review> {
        const appointment = await this.appointmentRepository.findOne({where: {id: appointmentId}});
        if (!appointment) throw new NotFoundException('Appointment not found');

        if (appointment.clientId !== clientId) {
            throw new ForbiddenException('This appointment does not belong to this client');
        }

        if (appointment.status !== AppointmentStatus.COMPLETED) {
            throw new BadRequestException('You can only review completed appointments');
        }

        const existing = await this.reviewRepository.findOne({where: {appointmentId}});
        if (existing) throw new BadRequestException('Review already exists for this appointment');

        const review = this.reviewRepository.create({rating, clientId, appointmentId});
        if (comment !== undefined) review.comment = comment;
        return this.reviewRepository.save(review);
    }

    async getMyReviews(userId: number): Promise<Review[]> {
        const client = await this.clientRepository.findOne({where: {user: {id: userId}}});
        if (!client) throw new NotFoundException('Client profile not found');

        return this.reviewRepository.find({
            where: {clientId: client.id},
            relations: {appointment: {master: true, service: true}},
            order: {createdAt: 'DESC'},
        });
    }
}
