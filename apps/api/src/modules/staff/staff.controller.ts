import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  ForbiddenException,
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
}
