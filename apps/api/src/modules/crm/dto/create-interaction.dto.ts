import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, MaxLength } from 'class-validator';
import {
  InteractionType,
  InteractionChannel,
  Sentiment,
  InteractionOutcome,
} from '@gymapp/shared-types';

export class CreateInteractionDto {
  @IsUUID()
  memberId: string;

  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @IsOptional()
  @IsEnum(InteractionChannel)
  channel?: InteractionChannel;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;

  @IsOptional()
  @IsEnum(InteractionOutcome)
  outcome?: InteractionOutcome;

  @IsOptional()
  @IsDateString()
  followUpAt?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
