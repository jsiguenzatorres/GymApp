import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller('me/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly svc: SubscriptionsService,
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

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const member = await this.resolveMember(user);
    return this.svc.listMine(member.id);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { product_id: string; quantity: number; frequency_days: number },
  ) {
    const member = await this.resolveMember(user);
    return this.svc.create(member.gym_id, member.id, body);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
      quantity?: number;
      frequency_days?: number;
    },
  ) {
    const member = await this.resolveMember(user);
    return this.svc.update(member.id, id, body);
  }

  @Delete(':id')
  async cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const member = await this.resolveMember(user);
    return this.svc.cancel(member.id, id);
  }
}
