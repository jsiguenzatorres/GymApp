import { Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('admin/scheduled-tasks')
@UseGuards(JwtAuthGuard)
export class ScheduledTasksController {
  constructor(private readonly svc: ScheduledTasksService) {}

  private requireSuperAdmin(user: JwtPayload) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'GYM_OWNER') {
      throw new ForbiddenException('Solo SUPER_ADMIN / GYM_OWNER puede ver estado de jobs');
    }
  }

  @Get('runs')
  recentRuns(@CurrentUser() user: JwtPayload) {
    this.requireSuperAdmin(user);
    return this.svc.getRecentRuns();
  }

  @Post('trigger/:job')
  trigger(
    @CurrentUser() user: JwtPayload,
    @Param('job') job: 'meals' | 'subscriptions' | 'adaptive' | 'dunning',
  ) {
    this.requireSuperAdmin(user);
    return this.svc.triggerJob(job);
  }
}
