import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { HealthDataService, HealthKind } from './health-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller('me/health-data')
@UseGuards(JwtAuthGuard)
export class HealthDataController {
  constructor(
    private readonly healthData: HealthDataService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveMemberId(user: JwtPayload): Promise<string> {
    const member = await this.prisma.member.findFirst({ where: { user_id: user.sub } });
    if (!member) throw new Error('Member no encontrado para el usuario actual');
    return member.id;
  }

  @Post()
  async log(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { kind: HealthKind; value: number; unit?: string; recorded_at?: string; notes?: string },
  ) {
    const memberId = await this.resolveMemberId(user);
    return this.healthData.log(memberId, body);
  }

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('kind') kind?: HealthKind,
    @Query('days') days?: string,
  ) {
    const memberId = await this.resolveMemberId(user);
    return this.healthData.listRecent(memberId, kind, days ? parseInt(days, 10) : 30);
  }

  @Get('summary')
  async summary(@CurrentUser() user: JwtPayload) {
    const memberId = await this.resolveMemberId(user);
    return this.healthData.summary(memberId);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const memberId = await this.resolveMemberId(user);
    return this.healthData.delete(memberId, id);
  }
}
