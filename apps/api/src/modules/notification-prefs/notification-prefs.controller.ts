import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { NotificationPrefsService, NotifKind } from './notification-prefs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller('me/notification-prefs')
@UseGuards(JwtAuthGuard)
export class NotificationPrefsController {
  constructor(
    private readonly svc: NotificationPrefsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveMemberId(user: JwtPayload): Promise<string> {
    const member = await this.prisma.member.findFirst({ where: { user_id: user.sub } });
    if (!member) throw new Error('Member no encontrado');
    return member.id;
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const memberId = await this.resolveMemberId(user);
    return this.svc.list(memberId);
  }

  @Post('seed')
  async seed(@CurrentUser() user: JwtPayload) {
    const memberId = await this.resolveMemberId(user);
    return this.svc.bulkSeed(memberId);
  }

  @Put()
  async upsert(
    @CurrentUser() user: JwtPayload,
    @Body() body: { kind: NotifKind; enabled: boolean; time_of_day?: string },
  ) {
    const memberId = await this.resolveMemberId(user);
    return this.svc.upsert(memberId, body);
  }
}
