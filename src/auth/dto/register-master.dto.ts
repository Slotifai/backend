import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterMasterDto {
  @ApiProperty({ example: 'master@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jane Smith', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: '+380991234567', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  phone: string;

  @ApiPropertyOptional({ example: 'Hair & Nails' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: 'Available on weekends' })
  @IsOptional()
  @IsString()
  notes?: string;
}
