import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AddonsService, AddonTier, AddonType } from './addons.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  private assertAdmin(user: JwtPayload) {
    const role = user.role;
    if (
      role !== 'SUPER_ADMIN' &&
      role !== 'GYM_OWNER' &&
      role !== 'GYM_ADMIN' &&
      role !== 'NUTRITIONIST'
    ) {
      throw new ForbiddenException('Sin permisos para gestionar add-ons');
    }
  }

  // ─── MEMBER ─────────────────────────────────────────────────────────────────
  // GET /api/v1/members/me/addons
  @Get('members/me/addons')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.addonsService.listMyAddons(user.sub, this.gymId(user));
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────────
  // GET /api/v1/admin/members/:memberId/addons
  @Get('admin/members/:memberId/addons')
  listForMember(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    this.assertAdmin(user);
    return this.addonsService.listAddonsForMember(this.gymId(user), memberId);
  }

  // POST /api/v1/admin/members/:memberId/addons
  // Body: { type: 'NUTRITION', tier: 'PRO', ends_at?, price_paid?, notes? }
  @Post('admin/members/:memberId/addons')
  assign(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body()
    body: {
      type: AddonType;
      tier: AddonTier;
      ends_at?: string | null;
      price_paid?: number;
      currency?: string;
      notes?: string;
    },
  ) {
    this.assertAdmin(user);
    return this.addonsService.assignAddon(this.gymId(user), memberId, {
      ...body,
      assigned_by_staff_id: user.staffId,
    });
  }

  // DELETE /api/v1/admin/members/:memberId/addons/:addonId
  @Delete('admin/members/:memberId/addons/:addonId')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Param('addonId', ParseUUIDPipe) addonId: string,
    @Body() body?: { reason?: string },
  ) {
    this.assertAdmin(user);
    return this.addonsService.cancelAddon(this.gymId(user), memberId, addonId, body?.reason);
  }
}
