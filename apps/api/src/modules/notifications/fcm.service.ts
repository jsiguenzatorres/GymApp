import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  // ─── Token management ──────────────────────────────────────────────────────

  async registerToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Invalid Expo push token for user ${userId}: ${token}`);
      return;
    }
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { user_id: userId, token, platform },
      update: { user_id: userId, platform },
    });
  }

  async removeToken(token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { token } }).catch(() => null);
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.deviceToken.findMany({
      where: { user_id: userId },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }

  // ─── Send ──────────────────────────────────────────────────────────────────

  async sendToUser(
    userId: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = await this.getTokensForUser(userId);
    if (!tokens.length) return;

    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      title: notification.title,
      body: notification.body,
      data: data ?? {},
      sound: 'default',
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const staleTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, i) => {
          if (ticket.status === 'error') {
            this.logger.warn(`Push error for token ${tokens[i]}: ${ticket.message}`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              staleTokens.push(tokens[i]);
            }
          }
        });
      } catch (err) {
        this.logger.error(`Expo push send error: ${err}`);
      }
    }

    if (staleTokens.length) {
      await Promise.all(staleTokens.map((t) => this.removeToken(t)));
      this.logger.log(`Removed ${staleTokens.length} stale push tokens for user ${userId}`);
    }

    this.logger.log(`Push sent to userId=${userId} (${tokens.length} device/s)`);
  }

  async sendToUsers(
    userIds: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<void> {
    await Promise.all(userIds.map((id) => this.sendToUser(id, notification, data)));
  }
}
