import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';
import { TelegramService } from './telegram.service';

@Controller()
export class TelegramController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveMember(user: JwtPayload) {
    const gymId = user.gymId;
    if (!gymId) throw new ForbiddenException('Sin contexto de gym');
    const member = await this.prisma.member.findFirst({
      where: { user_id: user.sub, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('Member no encontrado');
    return { gymId, memberId: member.id };
  }

  // ─── Member-facing (vinculación) ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('me/telegram/link-code')
  async generateLinkCode(@CurrentUser() user: JwtPayload) {
    const { gymId, memberId } = await this.resolveMember(user);
    return this.telegram.generateLinkCode(gymId, memberId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/telegram/status')
  async getStatus(@CurrentUser() user: JwtPayload) {
    const { gymId, memberId } = await this.resolveMember(user);
    return this.telegram.getLinkStatus(gymId, memberId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/telegram/unlink')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlink(@CurrentUser() user: JwtPayload) {
    const { gymId, memberId } = await this.resolveMember(user);
    await this.telegram.unlink(gymId, memberId);
  }

  // ─── Webhook público (sin JWT) ──────────────────────────────────────────────

  @Post('webhooks/telegram')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: unknown) {
    await this.telegram.handleUpdate(body as Parameters<TelegramService['handleUpdate']>[0]);
    return { ok: true };
  }
}
