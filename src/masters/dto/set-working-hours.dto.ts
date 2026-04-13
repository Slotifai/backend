import {Type} from 'class-transformer';
import {IsArray, ValidateNested} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {WorkingHoursItemDto} from "./working-hours-item.dto";

export class SetWorkingHoursDto {
  @ApiProperty({ type: [WorkingHoursItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursItemDto)
  schedule: WorkingHoursItemDto[];
}
