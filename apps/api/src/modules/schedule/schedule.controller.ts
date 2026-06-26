import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  private gymId(user: JwtPayload): string {
    return user.gymId ?? '';
  }

  private userId(user: JwtPayload): string {
    return user.sub;
  }

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
}
