import {IsEnum} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {AppointmentStatus} from '../../common/entities/appointmentStatus';

export class UpdateStatusDto {
    @ApiProperty({
        description: 'New status for the appointment',
        enum: AppointmentStatus,
        example: AppointmentStatus.COMPLETED,
    })
    @IsEnum(AppointmentStatus)
    status: AppointmentStatus;
}
