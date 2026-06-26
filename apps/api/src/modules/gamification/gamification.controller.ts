import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GamificationService, CreateBadgeDto, AwardPointsDto } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@RequiresPlan('PRO', 'ELITE', 'ENTERPRISE')
@Controller('gamification')
@UseGuards(JwtAuthGuard, PlanGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ─── Member endpoints ─────────────────────────────────────────────────────

  @Get('my-stats')
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getMemberStats(user.gymId ?? '', user.sub);
  }

  @Get('leaderboard')
  getLeaderboard(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getLeaderboard(user.gymId ?? '');
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  @Get('admin/stats')
  getGymStats(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getGymStats(user.gymId ?? '');
  }

  @Get('admin/badges')
  getAllBadges(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getAllBadges(user.gymId ?? '');
  }

  @Post('admin/badges')
  @HttpCode(HttpStatus.CREATED)
  createBadge(@CurrentUser() user: JwtPayload, @Body() dto: CreateBadgeDto) {
    return this.gamificationService.createBadge(user.gymId ?? '', dto);
  }

  @Patch('admin/badges/:id/toggle')
  toggleBadge(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.gamificationService.toggleBadge(user.gymId ?? '', id);
  }

  @Post('admin/award-points')
  @HttpCode(HttpStatus.CREATED)
  adminAwardPoints(@CurrentUser() user: JwtPayload, @Body() dto: AwardPointsDto) {
    return this.gamificationService.adminAwardPoints(user.gymId ?? '', dto);
  }

  @Get('admin/transactions')
  getRecentTransactions(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getRecentTransactions(user.gymId ?? '');
  }

  @Get('admin/leaderboard')
  getAdminLeaderboard(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getLeaderboard(user.gymId ?? '');
  }
}
