import {ApiProperty} from '@nestjs/swagger';

export class ChatResponseDto {
    @ApiProperty({example: 'I recommend master Olena — rating 4.8, Haircut 30min $15'})
    reply: string;
}
