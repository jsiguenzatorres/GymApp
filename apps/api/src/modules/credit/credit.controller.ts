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
import { CreditService, CreditKind } from './credit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(
    private readonly svc: CreditService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveMemberFromUser(user: JwtPayload) {
    const member = await this.prisma.member.findFirst({
      where: { user_id: user.sub },
      select: { id: true, gym_id: true },
    });
    if (!member) throw new ForbiddenException('Member no encontrado');
    return member;
  }

  private requireStaff(user: JwtPayload) {
    if (!['GYM_OWNER', 'GYM_ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Solo staff puede modificar crédito');
    }
  }

  // ─── MEMBER ─────────────────────────────────────────────────────────────
  @Get('me/credit')
  async getMine(@CurrentUser() user: JwtPayload) {
    const member = await this.resolveMemberFromUser(user);
    return this.svc.getMyBalance(member.id);
  }

  @Get('me/credit/history')
  async getMineHistory(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    const member = await this.resolveMemberFromUser(user);
    return this.svc.getMyHistory(member.id, limit ? parseInt(limit, 10) : 30);
  }

  @Get('me/marketplace/last-orders')
  async getMyLastOrders(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    const member = await this.resolveMemberFromUser(user);
    return this.svc.getMyLastOrders(member.gym_id, member.id, limit ? parseInt(limit, 10) : 5);
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────
  @Get('admin/members/:memberId/credit')
  async getAdmin(@CurrentUser() user: JwtPayload, @Param('memberId') memberId: string) {
    this.requireStaff(user);
    return this.svc.getMyBalance(memberId);
  }

  @Get('admin/members/:memberId/credit/history')
  async getAdminHistory(
    @CurrentUser() user: JwtPayload,
    @Param('memberId') memberId: string,
    @Query('limit') limit?: string,
  ) {
    this.requireStaff(user);
    return this.svc.getMyHistory(memberId, limit ? parseInt(limit, 10) : 30);
  }

  @Post('admin/members/:memberId/credit')
  async adminCreate(
    @CurrentUser() user: JwtPayload,
    @Param('memberId') memberId: string,
    @Body() body: { kind: CreditKind; amount_usd: number; note?: string },
  ) {
    this.requireStaff(user);
    if (!user.gymId) throw new ForbiddenException('gymId requerido');
    const staff = await this.prisma.staff.findFirst({
      where: { user_id: user.sub },
      select: { id: true },
    });
    return this.svc.createTransaction(user.gymId, memberId, {
      kind: body.kind,
      amount_usd: body.amount_usd,
      note: body.note,
      created_by_staff_id: staff?.id,
    });
  }
}
