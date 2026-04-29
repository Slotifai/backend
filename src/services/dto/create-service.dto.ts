import {ApiProperty} from '@nestjs/swagger';
import {IsInt, IsNumber, IsString, Min, MinLength} from 'class-validator';

export class CreateServiceDto {
    @ApiProperty({example: 'Haircut', description: 'Service name'})
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({example: 60, description: 'Duration in minutes'})
    @IsInt()
    @Min(1)
    durationMinutes: number;

    @ApiProperty({example: 500, description: 'Price'})
    @IsNumber()
    @Min(0)
    price: number;
}
