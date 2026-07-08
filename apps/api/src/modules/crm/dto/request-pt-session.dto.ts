import { IsString, IsOptional, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestPtSessionDto {
  @IsUUID()
  trainerId: string;

  @IsDateString()
  requestedAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
