import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    registerDecorator,
    ValidationArguments,
    ValidationOptions
} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

function IsAfterTime(property: string, validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isAfterTime',
            target: (object as { constructor: Function }).constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments) {
                    const relatedValue = (args.object as Record<string, unknown>)[args.constraints[0] as string];
                    if (typeof value !== 'string' || typeof relatedValue !== 'string') return true;
                    return value > relatedValue;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be after ${args.constraints[0] as string}`;
                },
            },
        });
    };
}

export class WorkingHoursItemDto {
    @ApiProperty({description: 'Day of week: 0 = Sunday, 6 = Saturday'})
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek: number;

    @ApiPropertyOptional({example: '09:00'})
    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    startTime?: string;

    @ApiPropertyOptional({example: '18:00'})
    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    @IsAfterTime('startTime', {message: 'endTime must be after startTime'})
    endTime?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isDayOff?: boolean;
}
