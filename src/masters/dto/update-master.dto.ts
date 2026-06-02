import {IsOptional, IsString, Length, Matches} from 'class-validator';
import {ApiPropertyOptional} from '@nestjs/swagger';

export class UpdateMasterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    name?: string;

    @ApiPropertyOptional({example: '+380991234567'})
    @IsOptional()
    @IsString()
    @Matches(/^\+38\d{10}$/, {message: 'Phone must be in format +38XXXXXXXXXX'})
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    specialization?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
