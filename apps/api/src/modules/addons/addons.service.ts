import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export type AddonType = 'NUTRITION';
export type AddonTier = 'BASIC' | 'PRO' | 'ELITE';

const VALID_TIERS: AddonTier[] = ['BASIC', 'PRO', 'ELITE'];
const VALID_TYPES: AddonType[] = ['NUTRITION'];

@Injectable()
export class AddonsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve el tier efectivo de NUTRITION para un miembro.
   * Si no tiene addon activo, retorna 'BASIC' (siempre incluido).
   */
  async getMemberNutritionTier(memberId: string): Promise<AddonTier> {
    const active = await this.prisma.memberAddon.findFirst({
      where: {
        member_id: memberId,
        type: 'NUTRITION',
        status: 'ACTIVE',
        OR: [{ ends_at: null }, { ends_at: { gte: new Date() } }],
      },
      orderBy: { starts_at: 'desc' },
    });
    if (!active) return 'BASIC';
    return (active.tier as AddonTier) ?? 'BASIC';
  }

  /** Lista todos los add-ons (activos e históricos) del miembro autenticado. */
  async listMyAddons(userId: string, gymId: string) {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Perfil de miembro no encontrado');
    const addons = await this.prisma.memberAddon.findMany({
      where: { member_id: member.id },
      orderBy: { created_at: 'desc' },
    });
    const nutritionTier = await this.getMemberNutritionTier(member.id);
    return { addons, effective: { nutrition_tier: nutritionTier } };
  }

  /** Lista add-ons de un miembro específico (admin). */
  async listAddonsForMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado en este gym');
    return this.prisma.memberAddon.findMany({
      where: { member_id: memberId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Activa un add-on para un miembro.
   * Si ya existe uno ACTIVE del mismo type, lo CANCELA primero (un solo activo por type).
   */
  async assignAddon(
    gymId: string,
    memberId: string,
    input: {
      type: AddonType;
      tier: AddonTier;
      ends_at?: string | null;
      price_paid?: number;
      currency?: string;
      assigned_by_staff_id?: string;
      notes?: string;
    },
  ) {
    if (!VALID_TYPES.includes(input.type)) {
      throw new BadRequestException(`Tipo inválido: ${input.type}`);
    }
    if (!VALID_TIERS.includes(input.tier)) {
      throw new BadRequestException(`Tier inválido: ${input.tier}`);
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado en este gym');

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Cancelar cualquier addon activo previo del mismo tipo
          await tx.memberAddon.updateMany({
            where: { member_id: memberId, type: input.type, status: 'ACTIVE' },
            data: {
              status: 'CANCELLED',
              cancellation_reason: 'Reemplazado por nuevo add-on',
              ends_at: new Date(),
            },
          });

          return tx.memberAddon.create({
            data: {
              member_id: memberId,
              type: input.type,
              tier: input.tier,
              status: 'ACTIVE',
              ends_at: input.ends_at ? new Date(input.ends_at) : null,
              price_paid: input.price_paid ?? null,
              currency: input.currency ?? 'USD',
              assigned_by_staff_id: input.assigned_by_staff_id ?? null,
              notes: input.notes ?? null,
            },
          });
        },
        // Serializable: si dos requests concurrentes intentan activar un addon
        // para el mismo miembro, Postgres aborta una de las dos transacciones
        // en vez de dejar que ambas vean "0 addons activos" y creen duplicados.
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      // P2002 = unique constraint violation (el partial index a nivel DB
      // que garantiza max 1 addon ACTIVE por member+type). Puede ocurrir si
      // dos transacciones serializable compiten — Postgres aborta una.
      const code = (err as { code?: string }).code;
      if (code === 'P2002' || code === '40001') {
        throw new ConflictException(
          'Ya se está procesando otro cambio de add-on para este miembro. Intenta de nuevo.',
        );
      }
      throw err;
    }
  }

  /** Cancela un add-on específico (admin). */
  async cancelAddon(gymId: string, memberId: string, addonId: string, reason?: string) {
    const addon = await this.prisma.memberAddon.findFirst({
      where: { id: addonId, member_id: memberId },
      include: { member: { select: { gym_id: true } } },
    });
    if (!addon) throw new NotFoundException('Add-on no encontrado');
    if (addon.member.gym_id !== gymId) {
      throw new NotFoundException('Add-on no pertenece a este gym');
    }
    if (addon.status !== 'ACTIVE') {
      throw new ConflictException('Este add-on ya no está activo');
    }
    return this.prisma.memberAddon.update({
      where: { id: addonId },
      data: {
        status: 'CANCELLED',
        cancellation_reason: reason ?? 'Cancelado por admin',
        ends_at: new Date(),
      },
    });
  }
}
