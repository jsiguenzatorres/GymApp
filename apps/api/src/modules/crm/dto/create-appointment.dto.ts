import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentType, AppointmentStatus } from '@gymapp/shared-types';

export class CreateAppointmentDto {
  @IsUUID()
  memberId: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMin?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
