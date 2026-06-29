import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SaasPlan } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FounderService } from './founder.service';

@Controller('founder-offer')
export class FounderController {
  constructor(private readonly founderService: FounderService) {}

  // ─── PÚBLICO (sin auth) — para landing page ──────────────────────────────────
  // GET /api/v1/founder-offer/status
  @Get('status')
  getStatus() {
    return this.founderService.getPublicStatus();
  }

  // ─── GYM OWNER — ver SU estado founder ─────────────────────────────────────
  // GET /api/v1/founder-offer/my-status
  @UseGuards(JwtAuthGuard)
  @Get('my-status')
  async myStatus(@CurrentUser() user: JwtPayload) {
    return this.founderService.getMyGymStatus(user.gymId);
  }

  // ─── ADMIN (SUPER_ADMIN del SaaS) ────────────────────────────────────────────
  // GET /api/v1/founder-offer/admin
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  getAdminConfig(@CurrentUser() user: JwtPayload) {
    this.assertSuperAdmin(user);
    return this.founderService.getAdminConfig();
  }

  // PATCH /api/v1/founder-offer/admin
  @UseGuards(JwtAuthGuard)
  @Patch('admin')
  updateConfig(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      total_slots?: number;
      starter_price?: number;
      pro_price?: number;
      elite_price?: number;
      regular_starter_price?: number;
      regular_pro_price?: number;
      regular_elite_price?: number;
      active?: boolean;
      deadline_at?: string | null;
      free_months?: number;
    },
  ) {
    this.assertSuperAdmin(user);
    return this.founderService.updateConfig(body);
  }

  // POST /api/v1/founder-offer/claim/:gymId  body: { plan: 'STARTER'|'PRO'|'ELITE' }
  // El SUPER_ADMIN asigna el Plan Fundador a un gym (al firmar contrato fundador).
  @UseGuards(JwtAuthGuard)
  @Post('claim/:gymId')
  claim(
    @CurrentUser() user: JwtPayload,
    @Param('gymId', ParseUUIDPipe) gymId: string,
    @Body() body: { plan: SaasPlan },
  ) {
    this.assertSuperAdmin(user);
    return this.founderService.claimForGym(gymId, body.plan);
  }

  // POST /api/v1/founder-offer/revoke/:gymId — caso fraude o error
  @UseGuards(JwtAuthGuard)
  @Post('revoke/:gymId')
  revoke(@CurrentUser() user: JwtPayload, @Param('gymId', ParseUUIDPipe) gymId: string) {
    this.assertSuperAdmin(user);
    return this.founderService.revokeForGym(gymId);
  }

  private assertSuperAdmin(user: JwtPayload) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo SUPER_ADMIN puede gestionar la oferta Fundador');
    }
  }
}
