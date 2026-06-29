import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type HealthKind = 'WEIGHT' | 'WATER' | 'SLEEP' | 'STEPS' | 'HEART_RATE' | 'HRV';

const VALID_KINDS: HealthKind[] = ['WEIGHT', 'WATER', 'SLEEP', 'STEPS', 'HEART_RATE', 'HRV'];

const DEFAULT_UNIT: Record<HealthKind, string> = {
  WEIGHT: 'kg',
  WATER: 'ml',
  SLEEP: 'min',
  STEPS: 'count',
  HEART_RATE: 'bpm',
  HRV: 'ms',
};

@Injectable()
export class HealthDataService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    memberId: string,
    dto: { kind: HealthKind; value: number; unit?: string; recorded_at?: string; notes?: string },
  ) {
    if (!VALID_KINDS.includes(dto.kind)) {
      throw new NotFoundException(`Tipo inválido. Permitidos: ${VALID_KINDS.join(', ')}`);
    }
    if (!Number.isFinite(dto.value) || dto.value < 0) {
      throw new NotFoundException('Valor inválido (debe ser número >= 0)');
    }
    return this.prisma.healthDataEntry.create({
      data: {
        member_id: memberId,
        kind: dto.kind,
        value: dto.value,
        unit: dto.unit ?? DEFAULT_UNIT[dto.kind],
        recorded_at: dto.recorded_at ? new Date(dto.recorded_at) : new Date(),
        source: 'manual',
        notes: dto.notes,
      },
    });
  }

  async listRecent(memberId: string, kind?: HealthKind, days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.prisma.healthDataEntry.findMany({
      where: {
        member_id: memberId,
        recorded_at: { gte: start },
        ...(kind ? { kind } : {}),
      },
      orderBy: { recorded_at: 'desc' },
      take: 200,
    });
  }

  async summary(memberId: string) {
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const entries = await this.prisma.healthDataEntry.findMany({
      where: { member_id: memberId, recorded_at: { gte: since30 } },
      orderBy: { recorded_at: 'desc' },
    });

    const latestByKind = new Map<string, { value: number; recorded_at: Date; unit: string }>();
    for (const e of entries) {
      if (!latestByKind.has(e.kind)) {
        latestByKind.set(e.kind, {
          value: Number(e.value),
          recorded_at: e.recorded_at,
          unit: e.unit,
        });
      }
    }

    // Tendencia de peso (último vs hace 14 días)
    const weights = entries
      .filter((e) => e.kind === 'WEIGHT')
      .map((e) => ({ value: Number(e.value), date: e.recorded_at }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let weightTrend = null as null | {
      latest: number;
      previous: number;
      delta_kg: number;
      days_between: number;
    };
    if (weights.length >= 2) {
      const latest = weights[weights.length - 1];
      const previous = weights[0];
      const days = Math.max(
        1,
        Math.round((latest.date.getTime() - previous.date.getTime()) / 86_400_000),
      );
      weightTrend = {
        latest: latest.value,
        previous: previous.value,
        delta_kg: Number((latest.value - previous.value).toFixed(2)),
        days_between: days,
      };
    }

    // Promedio diario de agua (últimos 7 días)
    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);
    const waterEntries = entries.filter((e) => e.kind === 'WATER' && e.recorded_at >= since7);
    const waterByDay = new Map<string, number>();
    for (const e of waterEntries) {
      const key = e.recorded_at.toISOString().slice(0, 10);
      waterByDay.set(key, (waterByDay.get(key) ?? 0) + Number(e.value));
    }
    const waterAvgMl =
      waterByDay.size > 0
        ? Math.round(Array.from(waterByDay.values()).reduce((a, b) => a + b, 0) / waterByDay.size)
        : 0;

    return {
      latest: Object.fromEntries(latestByKind),
      weight_trend: weightTrend,
      water_avg_ml_7d: waterAvgMl,
      total_entries_30d: entries.length,
    };
  }

  async delete(memberId: string, id: string) {
    const found = await this.prisma.healthDataEntry.findFirst({
      where: { id, member_id: memberId },
    });
    if (!found) throw new NotFoundException('Registro no encontrado');
    return this.prisma.healthDataEntry.delete({ where: { id } });
  }
}
