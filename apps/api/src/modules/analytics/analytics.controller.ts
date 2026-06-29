import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // GET /api/v1/analytics/dashboard
  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboard(this.gymId(user));
  }

  // GET /api/v1/analytics/revenue?months=6
  @Get('revenue')
  getRevenueTrend(@CurrentUser() user: JwtPayload, @Query('months') months?: string) {
    return this.analyticsService.getRevenueTrend(this.gymId(user), months ? parseInt(months) : 6);
  }

  // GET /api/v1/analytics/revenue-breakdown — D-32: ingresos por categoría
  @Get('revenue-breakdown')
  getRevenueBreakdown(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getRevenueBreakdown(this.gymId(user));
  }

  // GET /api/v1/analytics/memberships
  @Get('memberships')
  getMembershipBreakdown(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getMembershipBreakdown(this.gymId(user));
  }

  // POST /api/v1/analytics/snapshot
  @Post('snapshot')
  takeSnapshot(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.takeSnapshot(this.gymId(user));
  }

  // POST /api/v1/analytics/coach
  @Post('coach')
  async coachQuery(
    @Body() body: { query?: string; question?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const q = body.question ?? body.query ?? '';
    if (!q.trim()) throw new BadRequestException('question requerido');
    const answer = await this.analyticsService.businessCoachQuery(this.gymId(user), q);
    return { answer };
  }
}
