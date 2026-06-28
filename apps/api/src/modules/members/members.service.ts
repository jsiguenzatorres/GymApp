import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CreateMembershipTypeDto, UpdateMembershipTypeDto } from './dto/create-membership-type.dto';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import {
  AssignMembershipDto,
  FreezeMembershipDto,
  CancelMembershipDto,
} from './dto/membership-actions.dto';
import { ListMembersDto } from './dto/list-members.dto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // ─── MEMBERSHIP TYPES ────────────────────────────────────────────────────────

  async createMembershipType(gymId: string, dto: CreateMembershipTypeDto) {
    return this.prisma.membershipType.create({
      data: {
        gym_id: gymId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? 'USD',
        billing_frequency: dto.billingFrequency,
        duration_days: dto.durationDays,
        max_freezes: dto.maxFreezes ?? 1,
        max_freeze_days: dto.maxFreezeDays ?? 30,
        features: dto.features ?? [],
        is_trial: dto.isTrial ?? false,
        sort_order: dto.sortOrder ?? 0,
      },
    });
  }

  async listMembershipTypes(gymId: string) {
    const types = await this.prisma.membershipType.findMany({
      where: { gym_id: gymId },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      include: {
        _count: {
          select: { memberships: { where: { status: { in: ['ACTIVE', 'TRIAL', 'FROZEN'] } } } },
        },
      },
    });

    return types.map((t) => ({
      ...t,
      price: Number(t.price),
      activeCount: t._count.memberships,
    }));
  }

  async updateMembershipType(gymId: string, id: string, dto: UpdateMembershipTypeDto) {
    await this.findMembershipType(gymId, id);
    return this.prisma.membershipType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.billingFrequency !== undefined && { billing_frequency: dto.billingFrequency }),
        ...(dto.durationDays !== undefined && { duration_days: dto.durationDays }),
        ...(dto.maxFreezes !== undefined && { max_freezes: dto.maxFreezes }),
        ...(dto.maxFreezeDays !== undefined && { max_freeze_days: dto.maxFreezeDays }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.isTrial !== undefined && { is_trial: dto.isTrial }),
        ...(dto.sortOrder !== undefined && { sort_order: dto.sortOrder }),
      },
    });
  }

  async toggleMembershipType(gymId: string, id: string) {
    const type = await this.findMembershipType(gymId, id);
    return this.prisma.membershipType.update({
      where: { id },
      data: { is_active: !type.is_active },
    });
  }

  private async findMembershipType(gymId: string, id: string) {
    const type = await this.prisma.membershipType.findFirst({ where: { id, gym_id: gymId } });
    if (!type) throw new NotFoundException('Tipo de membresía no encontrado');
    return type;
  }

  // ─── MEMBERS ─────────────────────────────────────────────────────────────────

  async createMember(gymId: string, dto: CreateMemberDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese email');

    // Contraseña temporal — se enviará por email en Sprint 1.6
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          role: 'MEMBER',
          is_active: true,
          email_verified: false,
        },
      });

      const member = await tx.member.create({
        data: {
          gym_id: gymId,
          user_id: user.id,
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone,
          birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
          gender: dto.gender,
          source: dto.source ?? 'walk-in',
          notes: dto.notes,
          status: 'LEAD',
        },
      });

      return member;
    });

    const gym = await this.prisma.gym.findUnique({ where: { id: gymId }, select: { name: true } });
    const gymName = gym?.name ?? 'GymApp';
    const fullName = `${dto.firstName} ${dto.lastName}`;

    this.email
      .sendWelcomeEmail(email, fullName, tempPassword, gymName)
      .catch((err) => this.logger.error(`Failed to send welcome email: ${err}`));

    return this.getMember(gymId, result.id);
  }

  async listMembers(gymId: string, query: ListMembersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { gym_id: gymId };

    if (query.status) {
      where['status'] = query.status;
    }

    if (query.search) {
      const term = query.search.trim();
      where['OR'] = [
        { first_name: { contains: term, mode: 'insensitive' } },
        { last_name: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { phone: { contains: term } },
      ];
    }

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { email: true, is_active: true, last_login_at: true } },
          memberships: {
            where: { status: { in: ['ACTIVE', 'TRIAL', 'FROZEN'] } },
            take: 1,
            orderBy: { created_at: 'desc' },
            include: { type: { select: { name: true, billing_frequency: true } } },
          },
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: members.map((m) => ({
        ...m,
        activeMembership: m.memberships[0] ?? null,
        memberships: undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMyProfile(userId: string, gymId: string) {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gymId },
      include: {
        user: { select: { email: true, last_login_at: true } },
        memberships: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: { type: true },
        },
      },
    });
    if (!member) throw new NotFoundException('Perfil de miembro no encontrado');
    return member;
  }

  async getMember(gymId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, gym_id: gymId },
      include: {
        user: {
          select: { email: true, is_active: true, last_login_at: true, email_verified: true },
        },
        memberships: {
          orderBy: { created_at: 'desc' },
          include: { type: true },
        },
      },
    });

    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member;
  }

  async updateMember(gymId: string, id: string, dto: UpdateMemberDto) {
    await this.findMemberRecord(gymId, id);
    return this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { first_name: dto.firstName }),
        ...(dto.lastName !== undefined && { last_name: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.birthdate !== undefined && { birthdate: new Date(dto.birthdate) }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  // ─── MEMBERSHIPS ─────────────────────────────────────────────────────────────

  async assignMembership(gymId: string, memberId: string, dto: AssignMembershipDto) {
    await this.findMemberRecord(gymId, memberId);

    const type = await this.prisma.membershipType.findFirst({
      where: { id: dto.typeId, gym_id: gymId, is_active: true },
    });
    if (!type) throw new NotFoundException('Tipo de membresía no encontrado o inactivo');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + type.duration_days);

    const membershipStatus = type.is_trial ? 'TRIAL' : 'ACTIVE';
    const memberStatus = type.is_trial ? 'TRIAL' : 'ACTIVE';

    const membership = await this.prisma.$transaction(async (tx) => {
      const m = await tx.membership.create({
        data: {
          gym_id: gymId,
          member_id: memberId,
          type_id: dto.typeId,
          status: membershipStatus,
          start_date: startDate,
          end_date: endDate,
          price_paid: type.price,
          currency: type.currency,
          notes: dto.notes,
        },
        include: { type: true },
      });

      await tx.member.update({
        where: { id: memberId },
        data: { status: memberStatus },
      });

      return m;
    });

    return membership;
  }

  async getMemberMemberships(gymId: string, memberId: string) {
    await this.findMemberRecord(gymId, memberId);
    return this.prisma.membership.findMany({
      where: { member_id: memberId, gym_id: gymId },
      orderBy: { created_at: 'desc' },
      include: { type: { select: { name: true, billing_frequency: true, duration_days: true } } },
    });
  }

  async freezeMembership(
    gymId: string,
    memberId: string,
    membershipId: string,
    dto: FreezeMembershipDto,
  ) {
    const membership = await this.findActiveMembership(gymId, memberId, membershipId);

    if (membership.status !== 'ACTIVE') {
      throw new BadRequestException('Solo se puede congelar una membresía activa');
    }

    const type = await this.prisma.membershipType.findUnique({ where: { id: membership.type_id } });
    const maxFreezes = type?.max_freezes ?? 1;
    const maxFreezeDays = type?.max_freeze_days ?? 30;

    if (membership.freeze_count >= maxFreezes) {
      throw new BadRequestException(`Este plan permite máximo ${maxFreezes} congelación(es)`);
    }

    const now = new Date();
    let freezeEndsAt: Date;

    if (dto.freezeEndsAt) {
      freezeEndsAt = new Date(dto.freezeEndsAt);
      const days = Math.ceil((freezeEndsAt.getTime() - now.getTime()) / 86_400_000);
      if (days > maxFreezeDays) {
        throw new BadRequestException(`El período máximo de congelación es ${maxFreezeDays} días`);
      }
    } else {
      freezeEndsAt = new Date(now);
      freezeEndsAt.setDate(freezeEndsAt.getDate() + maxFreezeDays);
    }

    await this.prisma.$transaction([
      this.prisma.membership.update({
        where: { id: membershipId },
        data: {
          status: 'FROZEN',
          frozen_at: now,
          freeze_ends_at: freezeEndsAt,
          freeze_count: { increment: 1 },
        },
      }),
      this.prisma.member.update({
        where: { id: memberId },
        data: { status: 'FREEZE' },
      }),
    ]);

    return { message: 'Membresía congelada', freezeEndsAt };
  }

  async unfreezeMembership(gymId: string, memberId: string, membershipId: string) {
    const membership = await this.findActiveMembership(gymId, memberId, membershipId);

    if (membership.status !== 'FROZEN') {
      throw new BadRequestException('La membresía no está congelada');
    }

    const now = new Date();
    const frozenAt = membership.frozen_at ?? now;
    const frozenDays = Math.ceil((now.getTime() - frozenAt.getTime()) / 86_400_000);

    // Extender la fecha de vencimiento por los días congelados
    const newEndDate = new Date(membership.end_date);
    newEndDate.setDate(newEndDate.getDate() + frozenDays);

    await this.prisma.$transaction([
      this.prisma.membership.update({
        where: { id: membershipId },
        data: {
          status: 'ACTIVE',
          frozen_at: null,
          freeze_ends_at: null,
          end_date: newEndDate,
        },
      }),
      this.prisma.member.update({
        where: { id: memberId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    return { message: 'Membresía descongelada', newEndDate };
  }

  async cancelMembership(
    gymId: string,
    memberId: string,
    membershipId: string,
    dto: CancelMembershipDto,
  ) {
    const membership = await this.findActiveMembership(gymId, memberId, membershipId);

    const cancellableStatuses = ['ACTIVE', 'TRIAL', 'FROZEN'];
    if (!cancellableStatuses.includes(membership.status)) {
      throw new BadRequestException('Esta membresía no se puede cancelar');
    }

    await this.prisma.$transaction([
      this.prisma.membership.update({
        where: { id: membershipId },
        data: {
          status: 'CANCELLED',
          cancelled_at: new Date(),
          cancel_reason: dto.reason,
        },
      }),
      this.prisma.member.update({
        where: { id: memberId },
        data: { status: 'CANCELLED' },
      }),
    ]);

    return { message: 'Membresía cancelada' };
  }

  // ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

  private async findMemberRecord(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member;
  }

  private async findActiveMembership(gymId: string, memberId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, member_id: memberId, gym_id: gymId },
    });
    if (!membership) throw new NotFoundException('Membresía no encontrada');
    return membership;
  }
}
