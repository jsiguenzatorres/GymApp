import { Controller, Get, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('my-stats')
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getMemberStats(user.gymId ?? '', user.sub);
  }

  @Get('leaderboard')
  getLeaderboard(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getLeaderboard(user.gymId ?? '');
  }
}
