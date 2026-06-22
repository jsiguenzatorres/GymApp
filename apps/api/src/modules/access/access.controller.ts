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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // GET /api/v1/access/my-qr — el propio miembro obtiene su QR
  @Get('my-qr')
  getMyQr(@CurrentUser() user: JwtPayload) {
    // Para miembros: su propio QR. Para staff: se pasa memberId por query
    return this.accessService.generateQrCode(this.gymId(user), user.sub);
  }

  // GET /api/v1/access/member/:id/qr — staff genera QR para un miembro
  @Get('member/:id/qr')
  getMemberQr(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.accessService.generateQrCode(this.gymId(user), id);
  }

  // POST /api/v1/access/validate — scanner valida un QR
  @Post('validate')
  validateQr(
    @Body() body: { payload: string; deviceId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.accessService.validateQrCode(this.gymId(user), body.payload, body.deviceId);
  }

  // GET /api/v1/access/stats — dashboard de acceso
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.accessService.getAccessStats(this.gymId(user));
  }

  // GET /api/v1/access/logs
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

  // GET /api/v1/access/members/:id/logs
  @Get('members/:id/logs')
  memberLogs(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.accessService.listAccessLogs(this.gymId(user), { memberId: id, limit: 50 });
  }
}
