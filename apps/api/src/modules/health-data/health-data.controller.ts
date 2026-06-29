import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  // POST bulk-import — para que clientes nativos (HealthKit/Health Connect)
  // envíen lotes de mediciones de una vez (G7)
  @Post('bulk-import')
  async bulkImport(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      source: 'apple_health' | 'google_fit' | 'wearable';
      entries: Array<{
        kind: HealthKind;
        value: number;
        unit?: string;
        recorded_at: string;
        notes?: string;
      }>;
    },
  ) {
    const memberId = await this.resolveMemberId(user);
    let ok = 0;
    for (const entry of body.entries.slice(0, 500)) {
      try {
        await this.healthData.log(memberId, entry);
        ok++;
      } catch {
        // skip
      }
    }
    return { imported: ok, total: body.entries.length, source: body.source };
  }
}

// ─── ADMIN (J3): staff/trainer ve datos del miembro ──────────────────────
@Controller('admin/members')
@UseGuards(JwtAuthGuard)
export class HealthDataAdminController {
  constructor(private readonly healthData: HealthDataService) {}

  private requireStaff(user: JwtPayload) {
    if (!['GYM_OWNER', 'GYM_ADMIN', 'TRAINER', 'NUTRITIONIST', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Solo staff puede ver datos de salud de miembros');
    }
  }

  @Get(':memberId/health-data')
  async listAdmin(
    @CurrentUser() user: JwtPayload,
    @Param('memberId') memberId: string,
    @Query('kind') kind?: HealthKind,
    @Query('days') days?: string,
  ) {
    this.requireStaff(user);
    return this.healthData.listRecent(memberId, kind, days ? parseInt(days, 10) : 30);
  }

  @Get(':memberId/health-data/summary')
  async summaryAdmin(@CurrentUser() user: JwtPayload, @Param('memberId') memberId: string) {
    this.requireStaff(user);
    return this.healthData.summary(memberId);
  }
}
