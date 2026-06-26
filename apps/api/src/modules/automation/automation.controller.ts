import { Controller, Post, Get, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RiskScoreService } from './risk-score.service';
import { DunningService } from './dunning.service';
import { RetentionService } from './retention.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('automation')
export class AutomationController {
  constructor(
    private readonly riskScore: RiskScoreService,
    private readonly dunning: DunningService,
    private readonly retention: RetentionService,
  ) {}

  private gymId(user: JwtPayload): string {
    return (user as JwtPayload & { gymId: string }).gymId;
  }

  @Post('risk-score/recalculate')
  @HttpCode(202)
  async recalculateRiskScores(@CurrentUser() user: JwtPayload) {
    const count = await this.riskScore.recalculateGym(this.gymId(user));
    return { message: 'Risk score recalculation started', membersQueued: count };
  }

  @Get('risk-score/top-risk')
  getTopRisk(@CurrentUser() user: JwtPayload) {
    return this.riskScore.getTopRiskMembers(this.gymId(user));
  }

  @Post('dunning/process')
  @HttpCode(202)
  async processDunning() {
    await this.dunning.processDunning();
    return { message: 'Dunning processing triggered' };
  }

  @Post('dunning/:paymentId/init')
  @HttpCode(202)
  async initDunning(@Param('paymentId') paymentId: string, @CurrentUser() user: JwtPayload) {
    await this.dunning.initDunning(this.gymId(user), paymentId);
    return { message: 'Dunning initiated for payment' };
  }

  @Post('retention/run')
  @HttpCode(202)
  async runRetention(@CurrentUser() user: JwtPayload) {
    const gymId = this.gymId(user);
    void Promise.allSettled([
      this.retention.wf002Birthdays(gymId),
      this.retention.wf004L1Retention(gymId),
      this.retention.wf005L2Retention(gymId),
      this.retention.wf006CriticalRetention(gymId),
      this.retention.wf007WinBack(gymId),
      this.retention.wf008RenewalReminder(gymId),
    ]);
    return { message: 'Retention workflows triggered for gym', gymId };
  }
}
