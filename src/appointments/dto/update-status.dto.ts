import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../common/entities/appointmentStatus';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
