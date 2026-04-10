import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty} from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({description: 'User email address'})
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
