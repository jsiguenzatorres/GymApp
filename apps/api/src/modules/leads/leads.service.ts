import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateLeadDto {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
  assigned_to?: string;
}

export interface UpdateLeadDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  assigned_to?: string;
  trial_start?: string;
  trial_end?: string;
  lost_reason?: string;
}

const VALID_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL', 'CONVERTED', 'LOST'];

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(gymId: string, status?: string) {
    return this.prisma.lead.findMany({
      where: {
        gym_id: gymId,
        ...(status ? { status } : {}),
      },
      include: {
        assignee: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(gymId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        gym_id: gymId,
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        source: dto.source ?? 'OTHER',
        notes: dto.notes ?? null,
        assigned_to: dto.assigned_to ?? null,
      },
    });
  }

  async update(gymId: string, leadId: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, gym_id: gymId } });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const data: Record<string, unknown> = {};
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.assigned_to !== undefined) data.assigned_to = dto.assigned_to || null;
    if (dto.lost_reason !== undefined) data.lost_reason = dto.lost_reason;
    if (dto.status !== undefined && VALID_STATUSES.includes(dto.status)) data.status = dto.status;
    if (dto.trial_start !== undefined)
      data.trial_start = dto.trial_start ? new Date(dto.trial_start) : null;
    if (dto.trial_end !== undefined)
      data.trial_end = dto.trial_end ? new Date(dto.trial_end) : null;

    return this.prisma.lead.update({ where: { id: leadId }, data });
  }

  async remove(gymId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, gym_id: gymId } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    await this.prisma.lead.delete({ where: { id: leadId } });
  }

  async getStats(gymId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [byStatus, newThisWeek, convertedThisMonth] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { gym_id: gymId },
        _count: { id: true },
      }),
      this.prisma.lead.count({ where: { gym_id: gymId, created_at: { gte: weekAgo } } }),
      this.prisma.lead.count({
        where: { gym_id: gymId, status: 'CONVERTED', updated_at: { gte: monthAgo } },
      }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r._count.id]));
    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      new: statusMap['NEW'] ?? 0,
      contacted: statusMap['CONTACTED'] ?? 0,
      interested: statusMap['INTERESTED'] ?? 0,
      trial: statusMap['TRIAL'] ?? 0,
      converted: statusMap['CONVERTED'] ?? 0,
      lost: statusMap['LOST'] ?? 0,
      newThisWeek,
      convertedThisMonth,
    };
  }
}
