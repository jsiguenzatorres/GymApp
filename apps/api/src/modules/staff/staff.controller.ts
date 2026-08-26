import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { STAFF_ROLES } from '@gymapp/shared-types';

// Forma pública/reducida de un Staff cuando quien pregunta es un miembro (no-staff) —
// oculta email, teléfono, last_login_at y 2FA, que no son asunto de un miembro que
// solo necesita elegir con quién agendar una cita.
function toMemberSafeStaff(staff: {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  specialties: string[];
  is_active: boolean;
  user: { role: string };
}) {
  return {
    id: staff.id,
    first_name: staff.first_name,
    last_name: staff.last_name,
    avatar_url: staff.avatar_url,
    bio: staff.bio,
    specialties: staff.specialties,
    is_active: staff.is_active,
    role: staff.user.role,
  };
}

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  private isStaff(user: JwtPayload): boolean {
    return (STAFF_ROLES as readonly string[]).includes(user.role);
  }

  // GET /api/v1/staff/stats
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.staffService.getStats(this.gymId(user));
  }

  // GET /api/v1/staff
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const staffList = await this.staffService.list(this.gymId(user), {
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      search,
    });
    return this.isStaff(user) ? staffList : staffList.map(toMemberSafeStaff);
  }

  // GET /api/v1/staff/:id
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const staff = await this.staffService.getById(this.gymId(user), id);
    return this.isStaff(user) ? staff : toMemberSafeStaff(staff);
  }

  // POST /api/v1/staff
  @Post()
  create(
    @Body()
    body: {
      email: string;
      firstName: string;
      lastName: string;
      role: 'GYM_ADMIN' | 'TRAINER' | 'RECEPTIONIST' | 'NUTRITIONIST';
      phone?: string;
      bio?: string;
      specialties?: string[];
      hiredAt?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.create(this.gymId(user), body);
  }

  // PATCH /api/v1/staff/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
      specialties?: string[];
      isActive?: boolean;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.update(this.gymId(user), id, body);
  }

  // PATCH /api/v1/staff/:id/role
  @Patch(':id/role')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { role: 'GYM_ADMIN' | 'TRAINER' | 'RECEPTIONIST' | 'NUTRITIONIST' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.updateRole(this.gymId(user), id, body.role);
  }

  // DELETE /api/v1/staff/:id  (desactivación lógica)
  @Delete(':id')
  deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.staffService.deactivate(this.gymId(user), id);
  }

  // GET /api/v1/staff/:id/availability — horario de trabajo recurrente.
  // Staff-only: es información operativa del calendario, no algo que un
  // miembro necesite leer crudo.
  @Get(':id/availability')
  getAvailability(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!this.isStaff(user)) throw new ForbiddenException('Solo staff puede ver horarios');
    return this.staffService.getAvailability(this.gymId(user), id);
  }

  // PUT /api/v1/staff/:id/availability — reemplaza el horario completo. Lo
  // define el operador desde el panel web (hoy no existe un panel propio
  // para que el staff lo autogestione).
  @Put(':id/availability')
  setAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { blocks: { dayOfWeek: number; startTime: string; endTime: string }[] },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!this.isStaff(user)) throw new ForbiddenException('Solo staff puede editar horarios');
    return this.staffService.setAvailability(this.gymId(user), id, body.blocks ?? []);
  }

  // GET /api/v1/staff/:id/available-slots?date=YYYY-MM-DD&durationMin=60
  // Fase 3 — "búscame un hueco de X minutos con este entrenador ese día".
  @Get(':id/available-slots')
  getAvailableSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
    @Query('durationMin') durationMin: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!this.isStaff(user)) throw new ForbiddenException('Solo staff puede buscar disponibilidad');
    if (!date) throw new BadRequestException('date es requerido (YYYY-MM-DD)');
    return this.staffService.getAvailableSlots(
      this.gymId(user),
      id,
      date,
      durationMin ? parseInt(durationMin, 10) : 60,
    );
  }

  // GET /api/v1/staff/:id/check-availability?scheduledAt=ISO&durationMin=60
  // Fase 3 — valida un horario específico propuesto antes de asignarlo.
  @Get(':id/check-availability')
  checkAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('scheduledAt') scheduledAt: string,
    @Query('durationMin') durationMin: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!this.isStaff(user))
      throw new ForbiddenException('Solo staff puede consultar disponibilidad');
    if (!scheduledAt) throw new BadRequestException('scheduledAt es requerido (ISO 8601)');
    return this.staffService.checkAvailability(
      this.gymId(user),
      id,
      scheduledAt,
      durationMin ? parseInt(durationMin, 10) : 60,
    );
  }
}
