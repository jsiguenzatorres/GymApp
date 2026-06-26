import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ScheduleService, CreateClassTypeDto, CreateSessionDto } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@RequiresPlan('PRO', 'ELITE', 'ENTERPRISE')
@Controller('schedule')
@UseGuards(JwtAuthGuard, PlanGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  private gymId(user: JwtPayload): string {
    return user.gymId ?? '';
  }

  private userId(user: JwtPayload): string {
    return user.sub;
  }

  // ─── Member endpoints ─────────────────────────────────────────────────────

  @Get('class-types')
  getClassTypes(@CurrentUser() user: JwtPayload) {
    return this.scheduleService.getClassTypes(this.gymId(user));
  }

  @Get('sessions')
  getSessions(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const now = new Date();
    const defaultEnd = new Date(now);
    defaultEnd.setDate(defaultEnd.getDate() + 7);

    const start = startDate ? new Date(startDate) : now;
    const end = endDate ? new Date(endDate) : defaultEnd;

    return this.scheduleService.getSessions(this.gymId(user), this.userId(user), start, end);
  }

  @Post('sessions/:id/enroll')
  @HttpCode(HttpStatus.CREATED)
  enroll(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.scheduleService.enroll(this.gymId(user), this.userId(user), id);
  }

  @Delete('sessions/:id/enroll')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelEnrollment(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.scheduleService.cancelEnrollment(this.gymId(user), this.userId(user), id);
  }

  @Get('my-enrollments')
  getMyEnrollments(@CurrentUser() user: JwtPayload) {
    return this.scheduleService.getMyEnrollments(this.gymId(user), this.userId(user));
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  @Get('admin/class-types')
  getAdminClassTypes(@CurrentUser() user: JwtPayload) {
    return this.scheduleService.getAdminClassTypes(this.gymId(user));
  }

  @Post('admin/class-types')
  @HttpCode(HttpStatus.CREATED)
  createClassType(@CurrentUser() user: JwtPayload, @Body() dto: CreateClassTypeDto) {
    return this.scheduleService.createClassType(this.gymId(user), dto);
  }

  @Patch('admin/class-types/:id/toggle')
  toggleClassType(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.scheduleService.toggleClassType(this.gymId(user), id);
  }

  @Post('admin/sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(@CurrentUser() user: JwtPayload, @Body() dto: CreateSessionDto) {
    return this.scheduleService.createSession(this.gymId(user), dto);
  }

  @Get('admin/sessions')
  getAdminSessions(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.getAdminSessions(
      this.gymId(user),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('admin/sessions/:id/enrollments')
  getSessionEnrollments(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.scheduleService.getSessionEnrollments(this.gymId(user), id);
  }
}
