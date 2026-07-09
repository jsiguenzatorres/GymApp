import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';
import { RequestPtSessionDto } from './dto/request-pt-session.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // GET /api/v1/crm/overview
  @Get('crm/overview')
  getOverview(@CurrentUser() user: JwtPayload) {
    return this.crmService.getOverview(this.gymId(user));
  }

  // POST /api/v1/crm/risk-scores/recalculate
  @Post('crm/risk-scores/recalculate')
  recalculateAll(@CurrentUser() user: JwtPayload) {
    return this.crmService.recalculateAllRiskScores(this.gymId(user));
  }

  // POST /api/v1/members/:id/risk-score/recalculate
  @Post('members/:id/risk-score/recalculate')
  recalculateOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.crmService.calculateRiskScore(this.gymId(user), id);
  }

  // GET /api/v1/members/:id/interactions
  @Get('members/:id/interactions')
  listInteractions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.crmService.listInteractions(this.gymId(user), id);
  }

  // POST /api/v1/crm/interactions
  @Post('crm/interactions')
  createInteraction(@Body() dto: CreateInteractionDto, @CurrentUser() user: JwtPayload) {
    return this.crmService.createInteraction(this.gymId(user), user.staffId ?? user.sub, dto);
  }

  // GET /api/v1/appointments
  @Get('appointments')
  listAppointments(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('memberId') memberId?: string,
  ) {
    return this.crmService.listAppointments(this.gymId(user), { status, from, to, memberId });
  }

  // POST /api/v1/appointments
  @Post('appointments')
  createAppointment(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.crmService.createAppointment(this.gymId(user), dto);
  }

  // PATCH /api/v1/appointments/:id/status
  @Patch('appointments/:id/status')
  updateAppointmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.crmService.updateAppointmentStatus(this.gymId(user), id, dto);
  }

  // ─── Sesiones PT individuales (member-facing) ──────────────────────────────

  // POST /api/v1/me/pt-sessions
  @Post('me/pt-sessions')
  requestPtSession(@Body() dto: RequestPtSessionDto, @CurrentUser() user: JwtPayload) {
    return this.crmService.requestPtSession(this.gymId(user), user.sub, dto);
  }

  // GET /api/v1/me/pt-sessions
  @Get('me/pt-sessions')
  getMyPtSessions(@CurrentUser() user: JwtPayload) {
    return this.crmService.getMyPtSessions(this.gymId(user), user.sub);
  }

  // POST /api/v1/me/pt-sessions/:id/cancel
  @Post('me/pt-sessions/:id/cancel')
  cancelMyPtSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.crmService.cancelMyPtSession(this.gymId(user), user.sub, id);
  }

  // ─── Sesiones PT individuales (trainer/staff-facing) ───────────────────────

  // GET /api/v1/pt-sessions/pending — cola de solicitudes del trainer autenticado
  @Get('pt-sessions/pending')
  getMyPendingPtRequests(@CurrentUser() user: JwtPayload) {
    if (!user.staffId) throw new ForbiddenException('Solo staff puede ver solicitudes PT');
    return this.crmService.getMyPendingPtRequests(this.gymId(user), user.staffId);
  }

  // PATCH /api/v1/pt-sessions/:id/check-in
  @Patch('pt-sessions/:id/check-in')
  checkInPtSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.crmService.checkInPtSession(this.gymId(user), id);
  }

  // PATCH /api/v1/pt-sessions/:id/no-show
  @Patch('pt-sessions/:id/no-show')
  markPtNoShow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.crmService.markPtNoShow(this.gymId(user), id);
  }

  // POST /api/v1/aria/chat
  @Post('aria/chat')
  ariaChat(
    @Body()
    body: {
      message: string;
      memberId?: string;
      history?: { role: 'user' | 'aria'; content: string }[];
    },
    @CurrentUser() user: JwtPayload,
  ) {
    // Si NO se pasa memberId explícito (staff/admin usando ARIA sin contexto
    // de miembro), se pasa null — usar user.sub como fallback aquí rompía el
    // historial (el ID del staff no corresponde a ningún Member real).
    const memberId = body.memberId ?? null;
    return this.crmService.ariaChat(this.gymId(user), memberId, body.message, body.history);
  }
}
