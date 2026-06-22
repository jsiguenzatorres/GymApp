import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class StartSessionDto {
  @IsUUID()
  memberId: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsUUID()
  planDayId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
