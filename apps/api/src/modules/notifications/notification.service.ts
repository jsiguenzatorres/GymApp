import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FcmService } from './fcm.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcm: FcmService,
  ) {}

  // ─── CREAR ────────────────────────────────────────────────────────────────

  async create(dto: CreateNotifDto) {
    const notification = await this.prisma.notification.create({
      data: {
        gym_id: dto.gymId,
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: (dto.data ?? {}) as Prisma.InputJsonValue,
        channel: dto.channel ?? 'IN_APP',
      },
    });

    // Envío push fire-and-forget (no bloquea la creación de la notif)
    this.fcm
      .sendToUser(
        dto.userId,
        { title: dto.title, body: dto.body },
        { type: dto.type, gymId: dto.gymId, ...(dto.data ? this.toStringRecord(dto.data) : {}) },
      )
      .catch(() => {
        // los tokens inválidos los limpia FcmService internamente
      });

    return notification;
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
        user: { role: { in: roles as UserRole[] }, is_active: true },
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
        data: (data ?? {}) as Prisma.InputJsonValue,
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

    const [notification] = await Promise.all([
      this.create({ gymId, userId: member.user_id, type, title, body, data }),
      this.fcm.sendToUser(
        member.user_id,
        { title, body },
        { type, gymId, memberId, ...(data ? this.toStringRecord(data) : {}) },
      ),
    ]);

    return notification;
  }

  private toStringRecord(obj: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    );
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
