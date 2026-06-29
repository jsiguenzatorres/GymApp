import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddonsService } from '../addons/addons.service';

export interface BoxContentItem {
  name: string;
  brand?: string;
  quantity: number;
  qty_unit?: string;
}

@Injectable()
export class MonthlyBoxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addons: AddonsService,
  ) {}

  private currentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────
  async listAdmin(gymId: string) {
    return this.prisma.gymMonthlyBox.findMany({
      where: { gym_id: gymId },
      orderBy: { month: 'desc' },
      include: { _count: { select: { requests: true } } },
    });
  }

  async upsertAdmin(
    gymId: string,
    dto: {
      month?: string;
      title: string;
      description?: string;
      contents: BoxContentItem[];
      cover_url?: string;
      delivery_date?: string;
      is_published?: boolean;
    },
  ) {
    const month = dto.month ?? this.currentMonth();
    return this.prisma.gymMonthlyBox.upsert({
      where: { gym_id_month: { gym_id: gymId, month } },
      create: {
        gym_id: gymId,
        month,
        title: dto.title,
        description: dto.description,
        contents: dto.contents as never,
        cover_url: dto.cover_url,
        delivery_date: dto.delivery_date ? new Date(dto.delivery_date) : null,
        is_published: dto.is_published ?? false,
      },
      update: {
        title: dto.title,
        description: dto.description,
        contents: dto.contents as never,
        cover_url: dto.cover_url,
        delivery_date: dto.delivery_date ? new Date(dto.delivery_date) : undefined,
        ...(dto.is_published !== undefined ? { is_published: dto.is_published } : {}),
      },
    });
  }

  async listRequestsAdmin(gymId: string, status?: string) {
    return this.prisma.boxDeliveryRequest.findMany({
      where: { gym_id: gymId, ...(status ? { status } : {}) },
      orderBy: { requested_at: 'desc' },
      include: {
        member: { select: { id: true, first_name: true, last_name: true, phone: true } },
        box: { select: { id: true, title: true, month: true } },
      },
    });
  }

  async updateRequestStatusAdmin(gymId: string, requestId: string, status: string) {
    const valid = ['REQUESTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!valid.includes(status)) {
      throw new NotFoundException(`Status inválido. Permitidos: ${valid.join(', ')}`);
    }
    const found = await this.prisma.boxDeliveryRequest.findFirst({
      where: { id: requestId, gym_id: gymId },
    });
    if (!found) throw new NotFoundException('Solicitud no encontrada');
    return this.prisma.boxDeliveryRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === 'DELIVERED' ? { delivered_at: new Date() } : {}),
      },
    });
  }

  // ─── Member endpoints ─────────────────────────────────────────────────────
  /** Caja publicada del mes actual + estado de mi solicitud */
  async getCurrentForMember(gymId: string, memberId: string) {
    // Validar que el miembro tenga NutriElite
    const tier = await this.addons.getMemberNutritionTier(memberId);
    if (tier !== 'ELITE') {
      throw new ForbiddenException('La Caja del Mes es un beneficio exclusivo de NutriElite');
    }

    const month = this.currentMonth();
    const box = await this.prisma.gymMonthlyBox.findFirst({
      where: { gym_id: gymId, month, is_published: true },
    });
    if (!box) {
      return { box: null, my_request: null, tier };
    }

    const myRequest = await this.prisma.boxDeliveryRequest.findFirst({
      where: { member_id: memberId, box_id: box.id },
    });

    return { box, my_request: myRequest, tier };
  }

  async requestDelivery(
    gymId: string,
    memberId: string,
    dto: { delivery_address?: string; notes?: string },
  ) {
    const tier = await this.addons.getMemberNutritionTier(memberId);
    if (tier !== 'ELITE') {
      throw new ForbiddenException('La Caja del Mes es un beneficio exclusivo de NutriElite');
    }

    const month = this.currentMonth();
    const box = await this.prisma.gymMonthlyBox.findFirst({
      where: { gym_id: gymId, month, is_published: true },
    });
    if (!box) throw new NotFoundException('No hay caja publicada este mes');

    return this.prisma.boxDeliveryRequest.upsert({
      where: { member_id_box_id: { member_id: memberId, box_id: box.id } },
      create: {
        gym_id: gymId,
        member_id: memberId,
        box_id: box.id,
        delivery_address: dto.delivery_address,
        notes: dto.notes,
      },
      update: {
        delivery_address: dto.delivery_address,
        notes: dto.notes,
        status: 'REQUESTED',
      },
    });
  }
}
