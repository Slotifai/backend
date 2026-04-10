import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterClientDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: '+380991234567', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  phone: string;

  @ApiPropertyOptional({ example: 'Prefers morning slots' })
  @IsOptional()
  @IsString()
  notes?: string;
}
