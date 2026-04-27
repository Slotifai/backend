import { IsInt, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the service to book',
    type: Number,
  })
  @IsInt()
  serviceId: number;

  @ApiProperty({
    example: 2,
    description: 'Unique identifier of the master assigned to the appointment',
    type: Number,
  })
  @IsInt()
  masterId: number;

  @ApiProperty({
    example: '2024-06-01T10:00:00.000Z',
    description: 'Appointment start time in ISO 8601 format',
    format: 'date-time',
    type: String,
  })
  @IsISO8601()
  startTime: string;
}
