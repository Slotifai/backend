import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../common/entities/client.entity';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async getMyProfile(userId: number): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }

  async updateMyProfile(userId: number, dto: UpdateClientDto): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!client) throw new NotFoundException('Client profile not found');

    Object.assign(client, dto);
    return this.clientRepository.save(client);
  }
}
