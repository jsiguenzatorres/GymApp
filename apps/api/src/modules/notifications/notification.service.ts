import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface CreateNotifDto {
  gymId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CREAR ────────────────────────────────────────────────────────────────

  async create(dto: CreateNotifDto) {
    return this.prisma.notification.create({
      data: {
        gym_id: dto.gymId,
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data ?? {},
        channel: dto.channel ?? 'IN_APP',
      },
    });
  }

  async notifyStaffByRole(
    gymId: string,
    roles: string[],
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const staffUsers = await this.prisma.staff.findMany({
      where: {
        gym_id: gymId,
        is_active: true,
        user: { role: { in: roles }, is_active: true },
      },
      select: { user_id: true },
    });

    if (!staffUsers.length) return;

    await this.prisma.notification.createMany({
      data: staffUsers.map((s) => ({
        gym_id: gymId,
        user_id: s.user_id,
        type,
        title,
        body,
        data: data ?? {},
        channel: 'IN_APP',
      })),
      skipDuplicates: true,
    });
  }

  async notifyMember(
    gymId: string,
    memberId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId },
      select: { user_id: true },
    });
    if (!member) return;

    return this.create({ gymId, userId: member.user_id, type, title, body, data });
  }

  // ─── LEER ────────────────────────────────────────────────────────────────

  async list(userId: string, filter: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where = {
      user_id: userId,
      ...(filter.unreadOnly ? { is_read: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { user_id: userId, is_read: false } }),
    ]);

    return { items, total, unreadCount, page, pages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { user_id: userId, is_read: false } });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
  }
}
