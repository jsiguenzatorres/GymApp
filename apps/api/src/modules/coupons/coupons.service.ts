import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findFirst({
      where: { gym_id: gymId, code: dto.code.toUpperCase() },
    });
    if (existing) throw new BadRequestException('Ya existe un cupón con ese código');

    return this.prisma.coupon.create({
      data: {
        gym_id: gymId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        applies_to_type_ids: dto.applies_to_type_ids ?? [],
        starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
        max_uses_total: dto.max_uses_total,
        max_uses_per_member: dto.max_uses_per_member ?? 1,
        first_time_only: dto.first_time_only ?? false,
      },
    });
  }

  async list(gymId: string) {
    return this.prisma.coupon.findMany({
      where: { gym_id: gymId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getOne(gymId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, gym_id: gymId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    return coupon;
  }

  async update(gymId: string, id: string, dto: UpdateCouponDto) {
    await this.getOne(gymId, id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
      },
    });
  }

  async toggle(gymId: string, id: string) {
    const coupon = await this.getOne(gymId, id);
    return this.prisma.coupon.update({ where: { id }, data: { is_active: !coupon.is_active } });
  }

  /**
   * Valida un cupón contra un tipo de membresía y miembro específicos, SIN
   * redimirlo (no incrementa contadores). Usado para preview en checkout y
   * como paso previo obligatorio antes de applyAndRedeem().
   */
  async validate(
    gymId: string,
    code: string,
    membershipTypeId: string,
    memberId: string,
    price: number,
  ) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { gym_id: gymId, code: code.toUpperCase(), is_active: true },
    });
    if (!coupon) throw new NotFoundException('Cupón no válido');

    const now = new Date();
    if (coupon.starts_at && now < coupon.starts_at) {
      throw new BadRequestException('Este cupón aún no está vigente');
    }
    if (coupon.expires_at && now > coupon.expires_at) {
      throw new BadRequestException('Este cupón ya venció');
    }
    if (coupon.max_uses_total !== null && coupon.times_used >= coupon.max_uses_total) {
      throw new BadRequestException('Este cupón ya alcanzó su límite de usos');
    }
    if (
      coupon.applies_to_type_ids.length > 0 &&
      !coupon.applies_to_type_ids.includes(membershipTypeId)
    ) {
      throw new BadRequestException('Este cupón no aplica al plan seleccionado');
    }

    const usesByMember = await this.prisma.couponRedemption.count({
      where: { coupon_id: coupon.id, member_id: memberId },
    });
    if (usesByMember >= coupon.max_uses_per_member) {
      throw new BadRequestException('Ya usaste este cupón el máximo de veces permitido');
    }

    if (coupon.first_time_only) {
      const priorMemberships = await this.prisma.membership.count({
        where: { member_id: memberId },
      });
      if (priorMemberships > 0) {
        throw new BadRequestException('Este cupón es solo para miembros nuevos');
      }
    }

    const rawDiscount =
      coupon.discount_type === 'percentage'
        ? price * (Number(coupon.discount_value) / 100)
        : Number(coupon.discount_value);
    const discountAmount = Math.min(Math.round(rawDiscount * 100) / 100, price);

    return { coupon, discountAmount };
  }

  /** Registra el uso del cupón. Llamar SOLO después de crear la membresía/checkout con éxito. */
  async redeem(
    couponId: string,
    memberId: string,
    membershipId: string | undefined,
    discountApplied: number,
  ) {
    await this.prisma.$transaction([
      this.prisma.couponRedemption.create({
        data: {
          coupon_id: couponId,
          member_id: memberId,
          membership_id: membershipId,
          discount_applied: discountApplied,
        },
      }),
      this.prisma.coupon.update({
        where: { id: couponId },
        data: { times_used: { increment: 1 } },
      }),
    ]);
  }
}
