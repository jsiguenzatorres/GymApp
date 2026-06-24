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

@UseGuards(JwtAuthGuard)
@Controller('api/v1/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // GET /api/v1/staff/stats
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.staffService.getStats(this.gymId(user));
  }

  // GET /api/v1/staff
  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.staffService.list(this.gymId(user), {
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      search,
    });
  }

  // GET /api/v1/staff/:id
  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.staffService.getById(this.gymId(user), id);
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
