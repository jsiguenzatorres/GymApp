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

@UseGuards(JwtAuthGuard)
@Controller('api/v1')
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

  // POST /api/v1/aria/chat
  @Post('aria/chat')
  ariaChat(@Body() body: { message: string; memberId?: string }, @CurrentUser() user: JwtPayload) {
    return this.crmService.ariaChat(this.gymId(user), body.memberId ?? user.sub, body.message);
  }
}
