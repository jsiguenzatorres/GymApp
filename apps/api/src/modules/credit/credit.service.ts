import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type CreditKind = 'CHARGE' | 'PAYMENT' | 'USE' | 'REFUND';

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyBalance(memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId },
      select: { credit_balance_usd: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return { balance_usd: Number(member.credit_balance_usd) };
  }

  async getMyHistory(memberId: string, limit = 30) {
    return this.prisma.memberCreditTransaction.findMany({
      where: { member_id: memberId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async createTransaction(
    gymId: string,
    memberId: string,
    dto: {
      kind: CreditKind;
      amount_usd: number; // signed
      note?: string;
      related_order_id?: string;
      created_by_staff_id?: string;
    },
  ) {
    if (!Number.isFinite(dto.amount_usd) || dto.amount_usd === 0) {
      throw new ForbiddenException('Monto inválido');
    }
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findFirst({
        where: { id: memberId, gym_id: gymId },
        select: { id: true, credit_balance_usd: true },
      });
      if (!member) throw new NotFoundException('Miembro no encontrado');

      const newBalance = Number(member.credit_balance_usd) + dto.amount_usd;
      await tx.member.update({
        where: { id: memberId },
        data: { credit_balance_usd: newBalance },
      });
      return tx.memberCreditTransaction.create({
        data: {
          gym_id: gymId,
          member_id: memberId,
          kind: dto.kind,
          amount_usd: dto.amount_usd,
          balance_after: newBalance,
          note: dto.note,
          related_order_id: dto.related_order_id,
          created_by_staff_id: dto.created_by_staff_id,
        },
      });
    });
  }

  // ─── Re-orden ─────────────────────────────────────────────────────────────
  async getMyLastOrders(gymId: string, memberId: string, limit = 5) {
    return this.prisma.marketplaceOrder.findMany({
      where: { gym_id: gymId, member_id: memberId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image_url: true,
                is_active: true,
                stock: true,
              },
            },
          },
        },
      },
    });
  }
}
