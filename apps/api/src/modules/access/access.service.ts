import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac, randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../database/prisma.service';

const QR_TTL_MS = 60_000; // 60 segundos
const NONCE_WINDOW = 120_000; // 2 minutos para dedup de nonces

export interface QrPayload {
  v: number; // versión = 1
  mid: string; // memberId
  gid: string; // gymId
  ts: number; // timestamp ms
  exp: number; // expiresAt ms
  n: string; // nonce
  sig: string; // HMAC-SHA256
}

export type AccessResult =
  | 'GRANTED'
  | 'DENIED_EXPIRED'
  | 'DENIED_INVALID'
  | 'DENIED_INACTIVE'
  | 'DENIED_NO_MEMBERSHIP'
  | 'DENIED_REPLAY';

@Injectable()
export class AccessService {
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.secret = this.config.get<string>('QR_SECRET') ?? 'dev-qr-secret-change-in-prod';
  }

  // ─── GENERACIÓN DE QR ─────────────────────────────────────────────────────────

  async generateQrCode(
    gymId: string,
    memberId: string,
  ): Promise<{ payload: string; qrPayload: string; expiresAt: string; dataUrl: string }> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId },
      select: { id: true, status: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    if (!['ACTIVE', 'TRIAL'].includes(member.status)) {
      throw new ForbiddenException('El miembro no tiene una membresía activa');
    }

    const now = Date.now();
    const nonce = randomBytes(8).toString('hex');
    const exp = now + QR_TTL_MS;

    const sig = this.sign({ mid: memberId, gid: gymId, ts: now, exp, n: nonce });

    const qrPayload: QrPayload = { v: 1, mid: memberId, gid: gymId, ts: now, exp, n: nonce, sig };
    const payloadStr = JSON.stringify(qrPayload);

    const dataUrl = await QRCode.toDataURL(payloadStr, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    });

    return {
      payload: payloadStr,
      qrPayload: payloadStr,
      expiresAt: new Date(exp).toISOString(),
      dataUrl,
    };
  }

  async generateMyQrCode(
    gymId: string,
    userId: string,
  ): Promise<{ payload: string; qrPayload: string; expiresAt: string; dataUrl: string }> {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('No tienes perfil de miembro en este gym');
    return this.generateQrCode(gymId, member.id);
  }

  // ─── VALIDACIÓN DE QR ─────────────────────────────────────────────────────────

  async validateQrCode(
    gymId: string,
    rawPayload: string,
    deviceId?: string,
  ): Promise<{
    result: AccessResult;
    memberId?: string;
    memberName?: string;
    message: string;
  }> {
    let payload: QrPayload;

    try {
      payload = JSON.parse(rawPayload) as QrPayload;
    } catch {
      await this.log(gymId, null, 'DENIED_INVALID', 'QR', undefined, deviceId);
      return { result: 'DENIED_INVALID', message: 'QR inválido' };
    }

    // 1. Verificar versión y gym
    if (payload.v !== 1 || payload.gid !== gymId) {
      await this.log(gymId, null, 'DENIED_INVALID', 'QR', payload.n, deviceId);
      return { result: 'DENIED_INVALID', message: 'QR no pertenece a este gym' };
    }

    // 2. Verificar firma
    const expectedSig = this.sign({
      mid: payload.mid,
      gid: payload.gid,
      ts: payload.ts,
      exp: payload.exp,
      n: payload.n,
    });
    if (expectedSig !== payload.sig) {
      await this.log(gymId, payload.mid, 'DENIED_INVALID', 'QR', payload.n, deviceId);
      return { result: 'DENIED_INVALID', message: 'Firma inválida' };
    }

    // 3. Verificar expiración
    if (Date.now() > payload.exp) {
      await this.log(gymId, payload.mid, 'DENIED_EXPIRED', 'QR', payload.n, deviceId);
      return { result: 'DENIED_EXPIRED', message: 'QR expirado — solicita uno nuevo' };
    }

    // 4. Verificar nonce (anti-replay) — busca usos del mismo nonce en la ventana de tiempo
    const recentNonce = await this.prisma.accessLog.findFirst({
      where: {
        gym_id: gymId,
        nonce: payload.n,
        occurred_at: { gte: new Date(Date.now() - NONCE_WINDOW) },
      },
    });
    if (recentNonce) {
      await this.log(gymId, payload.mid, 'DENIED_REPLAY', 'QR', payload.n, deviceId);
      return { result: 'DENIED_REPLAY', message: 'QR ya fue utilizado — solicita uno nuevo' };
    }

    // 5. Verificar estado del miembro
    const member = await this.prisma.member.findFirst({
      where: { id: payload.mid, gym_id: gymId },
      select: { id: true, first_name: true, last_name: true, status: true },
    });
    if (!member) {
      await this.log(gymId, payload.mid, 'DENIED_INVALID', 'QR', payload.n, deviceId);
      return { result: 'DENIED_INVALID', message: 'Miembro no encontrado' };
    }
    if (!['ACTIVE', 'TRIAL'].includes(member.status)) {
      await this.log(gymId, member.id, 'DENIED_INACTIVE', 'QR', payload.n, deviceId);
      return {
        result: 'DENIED_INACTIVE',
        memberName: `${member.first_name} ${member.last_name}`,
        message: 'Membresía inactiva o suspendida',
      };
    }

    // 6. Verificar membresía vigente
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        member_id: member.id,
        gym_id: gymId,
        status: { in: ['ACTIVE', 'TRIAL'] },
        end_date: { gte: new Date() },
      },
    });
    if (!activeMembership) {
      await this.log(gymId, member.id, 'DENIED_NO_MEMBERSHIP', 'QR', payload.n, deviceId);
      return {
        result: 'DENIED_NO_MEMBERSHIP',
        memberName: `${member.first_name} ${member.last_name}`,
        message: 'Sin membresía vigente',
      };
    }

    // 7. Acceso concedido
    await this.log(gymId, member.id, 'GRANTED', 'QR', payload.n, deviceId);
    this.eventEmitter.emit('member.checked_in', { gymId, memberId: member.id });
    return {
      result: 'GRANTED',
      memberId: member.id,
      memberName: `${member.first_name} ${member.last_name}`,
      message: `Bienvenido, ${member.first_name}`,
    };
  }

  // ─── LOGS ─────────────────────────────────────────────────────────────────────

  async isOwnMember(gymId: string, userId: string, memberId: string): Promise<boolean> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId, user_id: userId },
      select: { id: true },
    });
    return !!member;
  }

  async listAccessLogs(
    gymId: string,
    filter: {
      result?: string;
      memberId?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { gym_id: gymId };
    if (filter.result) where['result'] = filter.result;
    if (filter.memberId) where['member_id'] = filter.memberId;
    if (filter.from || filter.to) {
      where['occurred_at'] = {
        ...(filter.from ? { gte: new Date(filter.from) } : {}),
        ...(filter.to ? { lte: new Date(filter.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        orderBy: { occurred_at: 'desc' },
        skip,
        take: limit,
        include: { member: { select: { id: true, first_name: true, last_name: true } } },
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAccessStats(gymId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 86_400_000);

    const [todayGranted, todayDenied, weekGranted, recentLogs] = await Promise.all([
      this.prisma.accessLog.count({
        where: { gym_id: gymId, result: 'GRANTED', occurred_at: { gte: today } },
      }),
      this.prisma.accessLog.count({
        where: { gym_id: gymId, result: { not: 'GRANTED' }, occurred_at: { gte: today } },
      }),
      this.prisma.accessLog.count({
        where: { gym_id: gymId, result: 'GRANTED', occurred_at: { gte: weekAgo } },
      }),
      this.prisma.accessLog.findMany({
        where: { gym_id: gymId },
        orderBy: { occurred_at: 'desc' },
        take: 10,
        include: { member: { select: { id: true, first_name: true, last_name: true } } },
      }),
    ]);

    return { todayGranted, todayDenied, weekGranted, recentLogs };
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────────────────

  private sign(fields: { mid: string; gid: string; ts: number; exp: number; n: string }): string {
    const data = `v1:${fields.mid}:${fields.gid}:${fields.ts}:${fields.exp}:${fields.n}`;
    return createHmac('sha256', this.secret).update(data).digest('hex');
  }

  private async log(
    gymId: string,
    memberId: string | null,
    result: AccessResult,
    method: string,
    nonce?: string,
    deviceId?: string,
  ) {
    await this.prisma.accessLog.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        result,
        method,
        nonce,
        device_id: deviceId,
      },
    });
  }
}
