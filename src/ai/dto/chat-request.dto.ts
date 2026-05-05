import {ApiProperty} from '@nestjs/swagger';
import {IsString, MaxLength, MinLength} from 'class-validator';

export class ChatRequestDto {
    @ApiProperty({example: 'I want a haircut, prefer highly rated masters'})
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    message: string;
}
