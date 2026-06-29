import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notifService: NotificationService,
    private readonly fcm: FcmService,
  ) {}

  // GET /api/v1/notifications
  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notifService.list(user.sub, {
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // GET /api/v1/notifications/unread-count
  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifService.getUnreadCount(user.sub).then((count) => ({ count }));
  }

  // PATCH /api/v1/notifications/:id/read
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notifService.markAsRead(user.sub, id);
  }

  // PATCH /api/v1/notifications/read-all
  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notifService.markAllAsRead(user.sub);
  }

  // POST /api/v1/notifications/device-token
  // Called by mobile on login/app-open to keep FCM token up to date
  @Post('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string; platform: 'ios' | 'android' },
  ) {
    await this.fcm.registerToken(user.sub, body.token, body.platform);
  }

  // DELETE /api/v1/notifications/device-token
  // Called on logout to stop receiving push notifications
  @Delete('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeToken(@Body() body: { token: string }) {
    await this.fcm.removeToken(body.token);
  }

  // ─── BROADCAST (admin) ─────────────────────────────────────────────────────
  @Post('admin/broadcast')
  async broadcast(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      title: string;
      body: string;
      segment?: 'all' | 'all_active' | 'tier_pro' | 'tier_elite' | 'at_risk';
      type?: string;
    },
  ) {
    if (!['GYM_OWNER', 'GYM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Solo staff puede enviar broadcasts');
    }
    if (!user.gymId) throw new ForbiddenException('gymId requerido');
    if (!body.title?.trim() || !body.body?.trim()) {
      throw new ForbiddenException('title y body son requeridos');
    }
    return this.notifService.broadcast(user.gymId, body);
  }
}
