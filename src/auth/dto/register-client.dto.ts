import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsEmail, IsOptional, IsString, Length, Matches, MinLength} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class RegisterClientDto {
    @ApiProperty({example: 'client@example.com'})
    @IsEmail()
    email: string;

    @ApiProperty({example: 'strongPass123', minLength: 6})
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({example: 'John', maxLength: 255})
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiProperty({example: 'Doe', maxLength: 255})
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiProperty({example: '+380991234567'})
    @IsString()
    @Matches(/^\+38\d{10}$/, {message: 'Phone must be in format +38XXXXXXXXXX'})
    phone: string;

    @ApiPropertyOptional({example: 'Prefers morning slots'})
    @IsOptional()
    @IsString()
    notes?: string;
}
