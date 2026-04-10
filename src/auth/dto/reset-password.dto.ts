import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, MinLength, MaxLength} from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({description: 'Password reset token'})
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({description: 'New password'})
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    @MaxLength(255)
    newPassword: string;
}
