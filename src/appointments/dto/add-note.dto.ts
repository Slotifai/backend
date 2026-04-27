import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNoteDto {
  @ApiProperty({
    description: 'Text content of the note',
    example: 'Patient reported mild improvement since last visit.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
