import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(memberId: string) {
    return this.prisma.productSubscription.findMany({
      where: { member_id: memberId, status: { in: ['ACTIVE', 'PAUSED'] } },
      orderBy: [{ status: 'asc' }, { next_delivery_at: 'asc' }],
      include: {
        product: { select: { id: true, name: true, price: true, image_url: true } },
      },
    });
  }

  async create(
    gymId: string,
    memberId: string,
    dto: { product_id: string; quantity: number; frequency_days: number },
  ) {
    if (dto.quantity < 1 || dto.frequency_days < 3) {
      throw new ForbiddenException('Cantidad mínima 1 y frecuencia mínima 3 días');
    }
    const product = await this.prisma.product.findFirst({
      where: { id: dto.product_id, gym_id: gymId, is_active: true },
    });
    if (!product) throw new NotFoundException('Producto no disponible');

    const next = new Date();
    next.setDate(next.getDate() + dto.frequency_days);

    return this.prisma.productSubscription.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        product_id: dto.product_id,
        quantity: dto.quantity,
        frequency_days: dto.frequency_days,
        next_delivery_at: next,
      },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
  }

  async update(
    memberId: string,
    subscriptionId: string,
    dto: { status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED'; quantity?: number; frequency_days?: number },
  ) {
    const sub = await this.prisma.productSubscription.findFirst({
      where: { id: subscriptionId, member_id: memberId },
    });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');

    return this.prisma.productSubscription.update({
      where: { id: subscriptionId },
      data: dto,
    });
  }

  async cancel(memberId: string, subscriptionId: string) {
    return this.update(memberId, subscriptionId, { status: 'CANCELLED' });
  }
}
