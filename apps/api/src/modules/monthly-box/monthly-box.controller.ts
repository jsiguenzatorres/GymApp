import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { MonthlyBoxService, BoxContentItem } from './monthly-box.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MonthlyBoxController {
  constructor(
    private readonly svc: MonthlyBoxService,
    private readonly prisma: PrismaService,
  ) {}

  private requireGymStaff(user: JwtPayload) {
    const staffRoles = ['GYM_OWNER', 'GYM_ADMIN', 'SUPER_ADMIN'];
    if (!staffRoles.includes(user.role)) {
      throw new ForbiddenException('Solo staff del gym puede gestionar la caja');
    }
  }

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('gymId requerido');
    return user.gymId;
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  @Get('admin/monthly-boxes')
  list(@CurrentUser() user: JwtPayload) {
    this.requireGymStaff(user);
    return this.svc.listAdmin(this.gymId(user));
  }

  @Post('admin/monthly-boxes')
  upsert(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      month?: string;
      title: string;
      description?: string;
      contents: BoxContentItem[];
      cover_url?: string;
      delivery_date?: string;
      is_published?: boolean;
    },
  ) {
    this.requireGymStaff(user);
    return this.svc.upsertAdmin(this.gymId(user), body);
  }

  @Get('admin/monthly-boxes/requests')
  listRequests(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    this.requireGymStaff(user);
    return this.svc.listRequestsAdmin(this.gymId(user), status);
  }

  @Put('admin/monthly-boxes/requests/:id')
  updateRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    this.requireGymStaff(user);
    return this.svc.updateRequestStatusAdmin(this.gymId(user), id, body.status);
  }

  // ─── MEMBER ───────────────────────────────────────────────────────────────
  private async resolveMemberId(user: JwtPayload): Promise<{ memberId: string; gymId: string }> {
    const member = await this.prisma.member.findFirst({
      where: { user_id: user.sub },
      select: { id: true, gym_id: true },
    });
    if (!member) throw new ForbiddenException('Member no encontrado');
    return { memberId: member.id, gymId: member.gym_id };
  }

  @Get('me/monthly-box')
  async getCurrent(@CurrentUser() user: JwtPayload) {
    const { memberId, gymId } = await this.resolveMemberId(user);
    return this.svc.getCurrentForMember(gymId, memberId);
  }

  @Post('me/monthly-box/request')
  async requestBox(
    @CurrentUser() user: JwtPayload,
    @Body() body: { delivery_address?: string; notes?: string },
  ) {
    const { memberId, gymId } = await this.resolveMemberId(user);
    return this.svc.requestDelivery(gymId, memberId, body);
  }
}
