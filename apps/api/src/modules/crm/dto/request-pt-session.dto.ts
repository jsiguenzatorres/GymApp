import { IsString, IsOptional, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestPtSessionDto {
  // Opcional: el nuevo flujo web permite que el miembro solo proponga día/hora
  // y el operador asigne el entrenador después (ver assignTrainer en
  // CrmService). Se mantiene opcional en vez de eliminarlo para no romper la
  // app móvil actual, que todavía manda trainerId — se retirará de mobile en
  // un cambio aparte.
  @IsOptional()
  @IsUUID()
  trainerId?: string;

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

export class AssignTrainerDto {
  @IsUUID()
  trainerId: string;
}
