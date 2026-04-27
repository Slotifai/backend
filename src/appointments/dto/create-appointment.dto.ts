import { IsInt, IsISO8601 } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  serviceId: number;

  @IsInt()
  masterId: number;

  @IsISO8601()
  startTime: string;
}
