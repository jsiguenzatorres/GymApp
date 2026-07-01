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
      // READ COMMITTED (default de Postgres/Prisma) — deliberadamente NO usamos
      // Serializable aqui. Serializable detecta conflictos de forma muy amplia
      // (incluso entre un GET de lectura concurrente y este UPDATE/INSERT sin
      // overlap real de filas), lo que causaba abortos falsos-positivos: la
      // transaccion completa (cancelar + crear) se revertia a medias segun el
      // punto exacto del fallo, dejando el addon anterior cancelado pero sin
      // el nuevo creado. La proteccion real contra duplicados no depende del
      // isolation level: viene del UNIQUE INDEX parcial en DB (migration
      // 20260701010000_member_addon_unique_active), que rechaza con P2002
      // cualquier segundo INSERT que intente crear un addon ACTIVE mientras
      // ya existe otro ACTIVE del mismo member+type — sin importar el orden
      // de llegada ni el isolation level de cada transaccion individual.
      return await this.prisma.$transaction(async (tx) => {
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
      });
    } catch (err) {
      // P2002 = unique constraint violation. Prisma expone esto de forma
      // confiable como PrismaClientKnownRequestError con .code === 'P2002'
      // (a diferencia de fallos crudos de serializacion de Postgres, que no
      // siempre llegan con un .code utilizable). Este es el caso real de
      // "dos requests casi simultaneas" — la segunda pierde la carrera del
      // INSERT y recibe un mensaje claro en vez de un 500 crudo.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          'Ya hay un cambio de add-on en curso para este miembro. Espera un segundo e intenta de nuevo.',
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
