import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SaasPlan } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const SINGLETON_KEY = 'default';

@Injectable()
export class FounderService {
  constructor(private readonly prisma: PrismaService) {}

  // Garantiza que exista la fila singleton de config — la crea con defaults si no existe.
  private async getOrCreateOffer() {
    let offer = await this.prisma.founderOffer.findUnique({ where: { key: SINGLETON_KEY } });
    if (!offer) {
      offer = await this.prisma.founderOffer.create({ data: { key: SINGLETON_KEY } });
    }
    return offer;
  }

  async getPublicStatus() {
    const offer = await this.getOrCreateOffer();
    const usedSlots = await this.prisma.gym.count({ where: { is_founder: true } });
    const slotsRemaining = Math.max(0, offer.total_slots - usedSlots);
    const deadlinePassed = offer.deadline_at ? offer.deadline_at.getTime() < Date.now() : false;
    const available = offer.active && slotsRemaining > 0 && !deadlinePassed;

    return {
      available,
      slotsRemaining,
      totalSlots: offer.total_slots,
      slotsUsed: usedSlots,
      deadlineAt: offer.deadline_at,
      freeMonths: offer.free_months,
      prices: {
        STARTER: Number(offer.starter_price),
        PRO: Number(offer.pro_price),
        ELITE: Number(offer.elite_price),
      },
      regularPrices: {
        STARTER: Number(offer.regular_starter_price),
        PRO: Number(offer.regular_pro_price),
        ELITE: Number(offer.regular_elite_price),
      },
    };
  }

  async getAdminConfig() {
    return this.getOrCreateOffer();
  }

  async updateConfig(input: {
    total_slots?: number;
    starter_price?: number;
    pro_price?: number;
    elite_price?: number;
    regular_starter_price?: number;
    regular_pro_price?: number;
    regular_elite_price?: number;
    active?: boolean;
    deadline_at?: string | null;
    free_months?: number;
  }) {
    await this.getOrCreateOffer();
    const data: Record<string, unknown> = {};
    if (input.total_slots !== undefined) data.total_slots = input.total_slots;
    if (input.starter_price !== undefined) data.starter_price = input.starter_price;
    if (input.pro_price !== undefined) data.pro_price = input.pro_price;
    if (input.elite_price !== undefined) data.elite_price = input.elite_price;
    if (input.regular_starter_price !== undefined)
      data.regular_starter_price = input.regular_starter_price;
    if (input.regular_pro_price !== undefined) data.regular_pro_price = input.regular_pro_price;
    if (input.regular_elite_price !== undefined)
      data.regular_elite_price = input.regular_elite_price;
    if (input.active !== undefined) data.active = input.active;
    if (input.deadline_at !== undefined) {
      data.deadline_at = input.deadline_at ? new Date(input.deadline_at) : null;
    }
    if (input.free_months !== undefined) data.free_months = input.free_months;

    return this.prisma.founderOffer.update({ where: { key: SINGLETON_KEY }, data });
  }

  // Marca un gym como Fundador. Decrementa cupos atómicamente (transacción + validación).
  async claimForGym(gymId: string, plan: SaasPlan) {
    if (plan === 'ENTERPRISE') {
      throw new BadRequestException('Enterprise no aplica al Plan Fundadores');
    }

    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.founderOffer.findUnique({ where: { key: SINGLETON_KEY } });
      if (!offer || !offer.active) {
        throw new ConflictException('La oferta Fundador no está activa');
      }
      if (offer.deadline_at && offer.deadline_at.getTime() < Date.now()) {
        throw new ConflictException('La oferta Fundador ya venció');
      }

      const used = await tx.gym.count({ where: { is_founder: true } });
      if (used >= offer.total_slots) {
        throw new ConflictException('No quedan cupos Fundador disponibles');
      }

      const gym = await tx.gym.findUnique({ where: { id: gymId } });
      if (!gym) throw new NotFoundException('Gym no encontrado');
      if (gym.is_founder) {
        throw new ConflictException('Este gym ya tiene el Plan Fundador asignado');
      }

      const lockedPrice =
        plan === 'STARTER'
          ? offer.starter_price
          : plan === 'PRO'
            ? offer.pro_price
            : offer.elite_price;

      return tx.gym.update({
        where: { id: gymId },
        data: {
          is_founder: true,
          founder_plan_type: plan,
          founder_locked_price: lockedPrice,
          founder_locked_at: new Date(),
          saas_plan: plan,
        },
      });
    });
  }

  // Devuelve el status del founder del gym del owner que pregunta + offer pública
  async getMyGymStatus(gymId?: string) {
    const offer = await this.getOrCreateOffer();
    if (!gymId) {
      return { gym_is_founder: false, offer };
    }
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: {
        is_founder: true,
        founder_plan_type: true,
        founder_locked_price: true,
        founder_locked_at: true,
      },
    });
    return {
      gym_is_founder: gym?.is_founder ?? false,
      gym_founder_plan_type: gym?.founder_plan_type ?? null,
      gym_founder_locked_price: gym?.founder_locked_price ? Number(gym.founder_locked_price) : null,
      gym_founder_locked_at: gym?.founder_locked_at,
      offer,
    };
  }

  // Revierte un claim (solo SUPER_ADMIN puede hacer esto — caso de fraude o error).
  async revokeForGym(gymId: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym no encontrado');
    if (!gym.is_founder) {
      throw new ConflictException('Este gym no tiene Plan Fundador asignado');
    }
    return this.prisma.gym.update({
      where: { id: gymId },
      data: {
        is_founder: false,
        founder_plan_type: null,
        founder_locked_price: null,
        founder_locked_at: null,
      },
    });
  }
}
