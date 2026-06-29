import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
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
}
