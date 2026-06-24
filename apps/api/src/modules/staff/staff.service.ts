import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../notifications/email.service';

const STAFF_ROLES = ['GYM_ADMIN', 'TRAINER', 'RECEPTIONIST', 'NUTRITIONIST'] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

interface CreateStaffDto {
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  phone?: string;
  bio?: string;
  specialties?: string[];
  hiredAt?: string;
}

interface UpdateStaffDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  isActive?: boolean;
}

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async list(gymId: string, filter: { role?: string; isActive?: boolean; search?: string }) {
    const where: Record<string, unknown> = { gym_id: gymId };

    if (filter.isActive !== undefined) where['is_active'] = filter.isActive;

    if (filter.search) {
      const q = filter.search.trim();
      where['OR'] = [
        { first_name: { contains: q, mode: 'insensitive' } },
        { last_name: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const staffList = await this.prisma.staff.findMany({
      where,
      orderBy: [{ is_active: 'desc' }, { first_name: 'asc' }],
      include: { user: { select: { id: true, email: true, role: true, last_login_at: true } } },
    });

    // Filtrar por rol después del join (role vive en User)
    const filtered = filter.role ? staffList.filter((s) => s.user.role === filter.role) : staffList;

    return filtered;
  }

  async getById(gymId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, gym_id: gymId },
      include: {
        user: {
          select: { id: true, email: true, role: true, last_login_at: true, two_fa_enabled: true },
        },
        appointments: {
          where: { occurred_at: { gte: new Date(Date.now() - 30 * 86_400_000) } },
          orderBy: { occurred_at: 'desc' },
          take: 5,
          include: { member: { select: { first_name: true, last_name: true } } },
        },
      },
    });
    if (!staff) throw new NotFoundException('Staff no encontrado');
    return staff;
  }

  async create(gymId: string, dto: CreateStaffDto) {
    if (!(STAFF_ROLES as readonly string[]).includes(dto.role)) {
      throw new BadRequestException(`Rol inválido. Válidos: ${STAFF_ROLES.join(', ')}`);
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese correo');

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const [user, gym] = await Promise.all([
      this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: dto.email,
            password_hash: passwordHash,
            role: dto.role,
            is_active: true,
          },
        });
        const newStaff = await tx.staff.create({
          data: {
            gym_id: gymId,
            user_id: newUser.id,
            first_name: dto.firstName,
            last_name: dto.lastName,
            phone: dto.phone,
            bio: dto.bio,
            specialties: dto.specialties ?? [],
            hired_at: dto.hiredAt ? new Date(dto.hiredAt) : new Date(),
          },
          include: { user: { select: { id: true, email: true, role: true } } },
        });
        return newStaff;
      }),
      this.prisma.gym.findUnique({ where: { id: gymId }, select: { name: true } }),
    ]);

    const gymName = gym?.name ?? 'GymApp';
    const fullName = `${dto.firstName} ${dto.lastName}`;
    this.email.sendWelcomeEmail(dto.email, fullName, tempPassword, gymName).catch(() => {});

    return user;
  }

  async update(gymId: string, staffId: string, dto: UpdateStaffDto) {
    const staff = await this.prisma.staff.findFirst({ where: { id: staffId, gym_id: gymId } });
    if (!staff) throw new NotFoundException('Staff no encontrado');

    return this.prisma.staff.update({
      where: { id: staffId },
      data: {
        ...(dto.firstName !== undefined && { first_name: dto.firstName }),
        ...(dto.lastName !== undefined && { last_name: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.specialties !== undefined && { specialties: dto.specialties }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async updateRole(gymId: string, staffId: string, newRole: StaffRole) {
    if (!(STAFF_ROLES as readonly string[]).includes(newRole)) {
      throw new BadRequestException(`Rol inválido. Válidos: ${STAFF_ROLES.join(', ')}`);
    }
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, gym_id: gymId },
      include: { user: true },
    });
    if (!staff) throw new NotFoundException('Staff no encontrado');

    await this.prisma.user.update({ where: { id: staff.user_id }, data: { role: newRole } });
    return { staffId, newRole };
  }

  async deactivate(gymId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id: staffId, gym_id: gymId } });
    if (!staff) throw new NotFoundException('Staff no encontrado');

    await this.prisma.$transaction([
      this.prisma.staff.update({ where: { id: staffId }, data: { is_active: false } }),
      this.prisma.user.update({ where: { id: staff.user_id }, data: { is_active: false } }),
    ]);
    return { staffId, deactivated: true };
  }

  async getStats(gymId: string) {
    const [total, active, byRole] = await Promise.all([
      this.prisma.staff.count({ where: { gym_id: gymId } }),
      this.prisma.staff.count({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: {
          staff: { some: { gym_id: gymId, is_active: true } },
          role: { in: ['GYM_ADMIN', 'TRAINER', 'RECEPTIONIST', 'NUTRITIONIST'] },
        },
        _count: { _all: true },
      }),
    ]);

    const roleMap = Object.fromEntries(byRole.map((r) => [r.role, r._count._all]));
    return { total, active, byRole: roleMap };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
      '',
    );
  }
}
