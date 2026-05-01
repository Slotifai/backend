import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsInt, IsOptional, IsString, Min} from 'class-validator';
import {Type} from 'class-transformer';

export class QueryMastersDto {
    @ApiPropertyOptional({example: 'Anna', description: 'Search by name'})
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({example: 'haircut', description: 'Filter by specialization'})
    @IsOptional()
    @IsString()
    specialization?: string;

    @ApiPropertyOptional({example: 1, default: 1})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({example: 20, default: 20})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}
