import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = (typeof DAYS)[number];

export interface DaySchedule {
  open: string; // "06:00"
  close: string; // "22:00"
  closed: boolean;
}

export type OperatingHours = Partial<Record<Day, DaySchedule>>;

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  tiktok?: string;
  twitter?: string;
}

interface UpdateProfileDto {
  name?: string;
  description?: string;
  city?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  timezone?: string;
  currency?: string;
  country?: string;
  logoUrl?: string;
}

interface UpdateFiscalDto {
  taxId?: string;
  legalName?: string;
}

const PLAN_LIMITS: Record<string, { maxMembers: number; modules: string[] }> = {
  STARTER: {
    maxMembers: 150,
    modules: ['AUTH', 'GYMS', 'MEM', 'BIL', 'ACCESS', 'STAFF', 'NOTIF'],
  },
  PRO: {
    maxMembers: 500,
    modules: [
      'AUTH',
      'GYMS',
      'MEM',
      'BIL',
      'ACCESS',
      'STAFF',
      'NOTIF',
      'WKT',
      'CRM_V',
      'ANALYTICS',
      'NUTRI',
      'SCHED',
      'FEEDBACK',
    ],
  },
  ELITE: {
    maxMembers: 9999,
    modules: [
      'AUTH',
      'GYMS',
      'MEM',
      'BIL',
      'ACCESS',
      'STAFF',
      'NOTIF',
      'WKT',
      'CRM_V',
      'ANALYTICS',
      'NUTRI',
      'MKT',
      'GAME',
      'CONTENT',
      'SCHED',
      'FEEDBACK',
      'LEADS',
    ],
  },
  ENTERPRISE: {
    maxMembers: 99999,
    modules: ['ALL'],
  },
};

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(gymId: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym no encontrado');
    return gym;
  }

  async updateProfile(gymId: string, dto: UpdateProfileDto) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym no encontrado');

    return this.prisma.gym.update({
      where: { id: gymId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.logoUrl !== undefined && { logo_url: dto.logoUrl }),
      },
    });
  }

  async updateFiscal(gymId: string, dto: UpdateFiscalDto) {
    return this.prisma.gym.update({
      where: { id: gymId },
      data: {
        ...(dto.taxId !== undefined && { tax_id: dto.taxId }),
        ...(dto.legalName !== undefined && { legal_name: dto.legalName }),
      },
    });
  }

  async getOperatingHours(gymId: string): Promise<OperatingHours> {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { operating_hours: true },
    });
    if (!gym) throw new NotFoundException('Gym no encontrado');
    return (gym.operating_hours ?? {}) as OperatingHours;
  }

  async updateOperatingHours(gymId: string, hours: OperatingHours) {
    // Validar que solo lleguen dÃ­as vÃ¡lidos
    const invalid = Object.keys(hours).filter((k) => !(DAYS as readonly string[]).includes(k));
    if (invalid.length) throw new ForbiddenException(`DÃ­as invÃ¡lidos: ${invalid.join(', ')}`);

    return this.prisma.gym.update({
      where: { id: gymId },
      data: { operating_hours: hours as Prisma.InputJsonValue },
      select: { operating_hours: true },
    });
  }

  async getSocialLinks(gymId: string): Promise<SocialLinks> {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { social_links: true },
    });
    if (!gym) throw new NotFoundException('Gym no encontrado');
    return (gym.social_links ?? {}) as SocialLinks;
  }

  async updateSocialLinks(gymId: string, links: SocialLinks) {
    return this.prisma.gym.update({
      where: { id: gymId },
      data: { social_links: links as Prisma.InputJsonValue },
      select: { social_links: true },
    });
  }

  async getPlanInfo(gymId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { saas_plan: true },
    });
    if (!gym) throw new NotFoundException('Gym no encontrado');

    const plan = gym.saas_plan;
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS['STARTER'];

    const activeMembers = await this.prisma.member.count({
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } },
    });

    return {
      plan,
      maxMembers: limits.maxMembers,
      activeMembers,
      usage: Math.round((activeMembers / limits.maxMembers) * 100),
      modules: limits.modules,
    };
  }

  async getStats(gymId: string) {
    const [members, staff, memberships, payments] = await Promise.all([
      this.prisma.member.count({ where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } } }),
      this.prisma.staff.count({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.membershipType.count({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.payment.count({
        where: {
          gym_id: gymId,
          status: 'SUCCEEDED',
          created_at: { gte: new Date(new Date().setDate(1)) },
        },
      }),
    ]);
    return {
      activeMembers: members,
      activeStaff: staff,
      membershipTypes: memberships,
      paymentsThisMonth: payments,
    };
  }
}
