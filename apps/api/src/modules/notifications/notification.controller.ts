import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

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
}
