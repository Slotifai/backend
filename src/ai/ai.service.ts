import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import Groq from 'groq-sdk';
import {Master} from '../common/entities/master.entity';
import {Service} from '../common/entities/service.entity';
import {Review} from '../common/entities/review.entity';
import {ChatResponseDto} from './dto/chat-response.dto';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly groq: Groq;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(Master)
        private readonly masterRepository: Repository<Master>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
    ) {
        const apiKey = this.configService.getOrThrow<string>('GROQ_API_KEY');
        this.groq = new Groq({apiKey});
    }

    async getRecommendation(message: string): Promise<ChatResponseDto> {
        const masters = await this.masterRepository.find({relations: {services: true}});

        const ratingsRaw = await this.reviewRepository
            .createQueryBuilder('r')
            .innerJoin('r.appointment', 'a')
            .select('a.masterId', 'masterId')
            .addSelect('AVG(r.rating)', 'avg')
            .groupBy('a.masterId')
            .getRawMany<{masterId: number; avg: string}>();

        const ratingMap = new Map(ratingsRaw.map(r => [r.masterId, parseFloat(parseFloat(r.avg).toFixed(2))]));

        const catalog = masters.map(m => {
            const rating = ratingMap.get(m.id) ?? 'no reviews';
            const services = m.services.length
                ? m.services.map(s => `${s.name} (${s.durationMinutes}min, $${s.price})`).join(', ')
                : 'no services';
            return `Master: ${m.name} | Specialization: ${m.specialization ?? 'general'} | Rating: ${rating} | Services: ${services}`;
        }).join('\n');

        const prompt = `You are a helpful assistant for the Slotifai booking platform. Always respond in Ukrainian language only.
Based on the following master catalog, recommend suitable masters and services to the client.
Be concise and specific. If no good match exists, say so politely.

Master catalog:
${catalog}

Client request: ${message}`;

        return this.callGroq(prompt);
    }

    async chat(message: string): Promise<ChatResponseDto> {
        const prompt = `You are a helpful assistant for Slotifai — an online appointment booking platform where clients can find and book masters (specialists) for various services such as haircuts, massages, manicures, and more.
Answer questions about the platform, how to book appointments, manage schedules, and related topics.
Be friendly, concise, and helpful. Always respond in Ukrainian language only.

User message: ${message}`;

        return this.callGroq(prompt);
    }

    private async callGroq(prompt: string): Promise<ChatResponseDto> {
        try {
            const completion = await this.groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{role: 'user', content: prompt}],
            });
            const reply = completion.choices[0]?.message?.content ?? '';
            return {reply};
        } catch (error) {
            this.logger.error('Groq API error', error);
            throw new InternalServerErrorException('AI service is temporarily unavailable');
        }
    }
}
