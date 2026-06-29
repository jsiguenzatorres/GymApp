import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamificationExtrasService } from './gamification-extras.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class GamificationExtrasController {
  constructor(
    private readonly svc: GamificationExtrasService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveMember(user: JwtPayload) {
    const member = await this.prisma.member.findFirst({
      where: { user_id: user.sub },
      select: { id: true, gym_id: true },
    });
    if (!member) throw new ForbiddenException('Member no encontrado');
    return member;
  }

  // ─── Challenges ──────────────────────────────────────────────────────────
  @Get('me/challenges')
  async listMyChallenges(@CurrentUser() user: JwtPayload) {
    const m = await this.resolveMember(user);
    return this.svc.listActiveChallenges(m.gym_id, m.id);
  }

  @Post('me/challenges/:id/join')
  async joinChallenge(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const m = await this.resolveMember(user);
    return this.svc.joinChallenge(m.id, id);
  }

  // ─── Leaderboard ────────────────────────────────────────────────────────
  @Get('me/leaderboard')
  async leaderboard(
    @CurrentUser() user: JwtPayload,
    @Query('scope') scope?: 'week' | 'month' | 'lifetime',
    @Query('limit') limit?: string,
  ) {
    const m = await this.resolveMember(user);
    return this.svc.getLeaderboard(m.gym_id, scope ?? 'week', limit ? parseInt(limit, 10) : 20);
  }

  // ─── Rewards store ──────────────────────────────────────────────────────
  @Get('me/rewards')
  async listRewards(@CurrentUser() user: JwtPayload) {
    const m = await this.resolveMember(user);
    return this.svc.listRewards(m.gym_id);
  }

  @Post('me/rewards/:id/redeem')
  async redeem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const m = await this.resolveMember(user);
    return this.svc.redeemReward(m.gym_id, m.id, id);
  }

  @Get('me/redemptions')
  async myRedemptions(@CurrentUser() user: JwtPayload) {
    const m = await this.resolveMember(user);
    return this.svc.listMyRedemptions(m.id);
  }

  // ─── Referrals ──────────────────────────────────────────────────────────
  @Get('me/referrals')
  async listMyReferrals(@CurrentUser() user: JwtPayload) {
    const m = await this.resolveMember(user);
    return this.svc.listMyReferrals(m.id);
  }

  @Post('me/referrals')
  async createReferral(@CurrentUser() user: JwtPayload, @Body() body: { email: string }) {
    const m = await this.resolveMember(user);
    return this.svc.createReferral(m.gym_id, m.id, body.email);
  }

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  private requireStaff(user: JwtPayload) {
    if (!['GYM_OWNER', 'GYM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Solo staff');
    }
  }
  private gymIdOf(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('gymId requerido');
    return user.gymId;
  }

  // Challenges
  @Get('admin/challenges')
  listChallengesAdmin(@CurrentUser() user: JwtPayload) {
    this.requireStaff(user);
    return this.svc.listChallengesAdmin(this.gymIdOf(user));
  }

  @Post('admin/challenges')
  createChallenge(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      goal_type: string;
      goal_value: number;
      reward_points?: number;
      starts_at: string;
      ends_at: string;
      cover_emoji?: string;
    },
  ) {
    this.requireStaff(user);
    return this.svc.createChallengeAdmin(this.gymIdOf(user), body);
  }

  @Patch('admin/challenges/:id')
  updateChallenge(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.requireStaff(user);
    return this.svc.updateChallengeAdmin(this.gymIdOf(user), id, body as never);
  }

  @Delete('admin/challenges/:id')
  deleteChallenge(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    this.requireStaff(user);
    return this.svc.deleteChallengeAdmin(this.gymIdOf(user), id);
  }

  // Rewards
  @Get('admin/rewards')
  listRewardsAdmin(@CurrentUser() user: JwtPayload) {
    this.requireStaff(user);
    return this.svc.listRewardsAdmin(this.gymIdOf(user));
  }

  @Post('admin/rewards')
  createReward(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      cost_points: number;
      stock?: number;
      cover_emoji?: string;
    },
  ) {
    this.requireStaff(user);
    return this.svc.createRewardAdmin(this.gymIdOf(user), body);
  }

  @Patch('admin/rewards/:id')
  updateReward(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.requireStaff(user);
    return this.svc.updateRewardAdmin(this.gymIdOf(user), id, body as never);
  }

  @Delete('admin/rewards/:id')
  deleteReward(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    this.requireStaff(user);
    return this.svc.deleteRewardAdmin(this.gymIdOf(user), id);
  }

  // Redemptions
  @Get('admin/redemptions')
  listRedemptionsAdmin(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    this.requireStaff(user);
    return this.svc.listRedemptionsAdmin(this.gymIdOf(user), status);
  }

  @Patch('admin/redemptions/:id')
  updateRedemption(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    this.requireStaff(user);
    return this.svc.updateRedemptionStatusAdmin(this.gymIdOf(user), id, body.status);
  }
}
