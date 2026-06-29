import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type NotifKind =
  | 'MEAL_REMINDER_BREAKFAST'
  | 'MEAL_REMINDER_LUNCH'
  | 'MEAL_REMINDER_DINNER'
  | 'WATER_HOURLY'
  | 'WORKOUT_REMINDER'
  | 'STREAK_AT_RISK';

const DEFAULT_TIME: Partial<Record<NotifKind, string>> = {
  MEAL_REMINDER_BREAKFAST: '08:00',
  MEAL_REMINDER_LUNCH: '13:00',
  MEAL_REMINDER_DINNER: '19:30',
  WORKOUT_REMINDER: '18:00',
};

@Injectable()
export class NotificationPrefsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(memberId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { member_id: memberId },
      orderBy: { kind: 'asc' },
    });
  }

  async upsert(memberId: string, dto: { kind: NotifKind; enabled: boolean; time_of_day?: string }) {
    return this.prisma.notificationPreference.upsert({
      where: { member_id_kind: { member_id: memberId, kind: dto.kind } },
      create: {
        member_id: memberId,
        kind: dto.kind,
        enabled: dto.enabled,
        time_of_day: dto.time_of_day ?? DEFAULT_TIME[dto.kind] ?? null,
      },
      update: {
        enabled: dto.enabled,
        ...(dto.time_of_day !== undefined ? { time_of_day: dto.time_of_day } : {}),
      },
    });
  }

  async bulkSeed(memberId: string) {
    const kinds: NotifKind[] = [
      'MEAL_REMINDER_BREAKFAST',
      'MEAL_REMINDER_LUNCH',
      'MEAL_REMINDER_DINNER',
      'WATER_HOURLY',
      'WORKOUT_REMINDER',
      'STREAK_AT_RISK',
    ];
    for (const kind of kinds) {
      await this.prisma.notificationPreference.upsert({
        where: { member_id_kind: { member_id: memberId, kind } },
        create: {
          member_id: memberId,
          kind,
          enabled: true,
          time_of_day: DEFAULT_TIME[kind] ?? null,
        },
        update: {},
      });
    }
    return this.list(memberId);
  }
}
