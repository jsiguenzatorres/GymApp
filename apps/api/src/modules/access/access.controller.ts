import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AccessService } from './access.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { STAFF_ROLES } from '@gymapp/shared-types';
import { OverrideAccessDto } from './dto/override-access.dto';

@UseGuards(JwtAuthGuard)
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // GET /api/v1/access/my-qr — el propio miembro obtiene su QR
  @Get('my-qr')
  getMyQr(@CurrentUser() user: JwtPayload) {
    return this.accessService.generateMyQrCode(this.gymId(user), user.sub);
  }

  // GET /api/v1/access/member/:id/qr — staff genera QR para un miembro
  @UseGuards(RolesGuard)
  @Roles(...STAFF_ROLES)
  @Get('member/:id/qr')
  getMemberQr(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.accessService.generateQrCode(this.gymId(user), id);
  }

  // POST /api/v1/access/validate — scanner valida un QR (staff/kiosco únicamente,
  // evita que un miembro se auto-conceda el ingreso llamando al endpoint directo)
  @UseGuards(RolesGuard)
  @Roles(...STAFF_ROLES)
  @Post('validate')
  validateQr(
    @Body() body: { payload: string; deviceId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.accessService.validateQrCode(this.gymId(user), body.payload, body.deviceId);
  }

  // POST /api/v1/access/override — staff anula un rechazo y deja entrar al
  // miembro a su criterio (ej. pagó en efectivo en el momento, período de gracia)
  @UseGuards(RolesGuard)
  @Roles(...STAFF_ROLES)
  @Post('override')
  overrideAccess(@Body() dto: OverrideAccessDto, @CurrentUser() user: JwtPayload) {
    return this.accessService.overrideAccess(
      this.gymId(user),
      user.sub,
      dto.memberId,
      dto.reason,
      dto.note,
    );
  }

  // GET /api/v1/access/stats — dashboard de acceso
  @UseGuards(RolesGuard)
  @Roles(...STAFF_ROLES)
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.accessService.getAccessStats(this.gymId(user));
  }

  // GET /api/v1/access/logs
  @UseGuards(RolesGuard)
  @Roles(...STAFF_ROLES)
  @Get('logs')
  listLogs(
    @CurrentUser() user: JwtPayload,
    @Query('result') result?: string,
    @Query('memberId') memberId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accessService.listAccessLogs(this.gymId(user), {
      result,
      memberId,
      from,
      to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // GET /api/v1/access/members/:id/logs — staff ve el historial de cualquier
  // miembro; un MEMBER solo puede ver su propio historial (verifica ownership,
  // ya que este endpoint lo usa la app móvil para "mi historial de acceso").
  @Get('members/:id/logs')
  async memberLogs(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const gymId = this.gymId(user);
    const isStaff = (STAFF_ROLES as readonly string[]).includes(user.role);
    if (!isStaff) {
      const own = await this.accessService.isOwnMember(gymId, user.sub, id);
      if (!own) throw new ForbiddenException('No puedes ver el historial de otro miembro');
    }
    return this.accessService.listAccessLogs(gymId, { memberId: id, limit: 50 });
  }
}
