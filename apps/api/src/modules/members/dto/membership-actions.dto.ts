import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class AssignMembershipDto {
  @IsUUID()
  typeId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FreezeMembershipDto {
  @IsOptional()
  @IsDateString()
  freezeEndsAt?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelMembershipDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
