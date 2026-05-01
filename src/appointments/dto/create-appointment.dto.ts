import {IsInt, IsISO8601} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {registerDecorator, ValidationArguments, ValidationOptions} from 'class-validator';

function IsFutureDate(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isFutureDate',
            target: (object as { constructor: Function }).constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    if (typeof value !== 'string') return false;
                    const date = new Date(value);
                    return !isNaN(date.getTime()) && date > new Date();
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a future date`;
                },
            },
        });
    };
}

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
        description: 'Appointment start time in ISO 8601 format (must be in the future)',
        format: 'date-time',
        type: String,
    })
    @IsISO8601()
    @IsFutureDate()
    startTime: string;
}
