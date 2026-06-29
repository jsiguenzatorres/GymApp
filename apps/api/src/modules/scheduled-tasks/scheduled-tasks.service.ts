import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { AddonsService } from '../addons/addons.service';

const MEAL_BY_HOUR: Record<number, { meal: string; kind: string; emoji: string }> = {
  10: { meal: 'BREAKFAST', kind: 'MEAL_REMINDER_BREAKFAST', emoji: '🍳' },
  14: { meal: 'LUNCH', kind: 'MEAL_REMINDER_LUNCH', emoji: '🍽️' },
  20: { meal: 'DINNER', kind: 'MEAL_REMINDER_DINNER', emoji: '🌙' },
};

export interface RunStat {
  job: string;
  ran_at: Date;
  duration_ms: number;
  ok: number;
  failed: number;
  note?: string;
}

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);
  private readonly recentRuns: RunStat[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly notif: NotificationService,
    private readonly nutrition: NutritionService,
    private readonly addons: AddonsService,
  ) {}

  private record(stat: RunStat) {
    this.recentRuns.unshift(stat);
    if (this.recentRuns.length > 50) this.recentRuns.length = 50;
  }

  getRecentRuns(): RunStat[] {
    return this.recentRuns;
  }

  // ─── F2: Recordatorios horarios de comidas ───────────────────────────────
  // Cada hora revisa si toca recordar desayuno/almuerzo/cena para miembros que:
  //   - tienen la pref enabled
  //   - NO han registrado esa comida hoy
  //   - tienen tier PRO o ELITE (las notifs no son para BASIC)
  @Cron(CronExpression.EVERY_HOUR, { name: 'meal-reminders' })
  async runMealReminders() {
    const start = Date.now();
    const now = new Date();
    const hour = now.getHours();
    const meta = MEAL_BY_HOUR[hour];
    if (!meta) return; // solo corremos en horas relevantes

    let ok = 0;
    let failed = 0;
    try {
      const prefs = await this.prisma.notificationPreference.findMany({
        where: { enabled: true, kind: meta.kind },
        include: {
          member: {
            select: {
              id: true,
              user_id: true,
              gym_id: true,
              first_name: true,
            },
          },
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const pref of prefs) {
        try {
          // tier check (BASIC no recibe recordatorios automáticos)
          const tier = await this.addons.getMemberNutritionTier(pref.member.id);
          if (tier === 'BASIC') continue;

          // ¿Ya registró esa comida hoy?
          const existingEntry = await this.prisma.foodDiaryEntry.findFirst({
            where: {
              member_id: pref.member.id,
              meal_type: meta.meal,
              date: { gte: today },
            },
            select: { id: true },
          });
          if (existingEntry) continue;

          await this.notif.create({
            gymId: pref.member.gym_id,
            userId: pref.member.user_id,
            type: meta.kind,
            title: `${meta.emoji} Hora de registrar tu ${this.mealLabel(meta.meal)}`,
            body: `${pref.member.first_name}, no olvides registrar lo que comiste para mantener tu plan en línea.`,
            data: { meal_type: meta.meal },
          });
          ok++;
        } catch (err) {
          failed++;
          this.logger.warn(`meal-reminder failed for ${pref.member.id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`meal-reminders crashed: ${(err as Error).message}`);
    }

    this.record({
      job: `meal-reminders[${meta.meal}]`,
      ran_at: now,
      duration_ms: Date.now() - start,
      ok,
      failed,
    });
    this.logger.log(`meal-reminders[${meta.meal}]: ${ok} sent · ${failed} failed`);
  }

  // ─── F3: Suscripciones de productos ──────────────────────────────────────
  // Cada día a las 8am crea órdenes para las suscripciones con next_delivery_at <= hoy
  @Cron('0 8 * * *', { name: 'product-subscriptions', timeZone: 'America/El_Salvador' })
  async runProductSubscriptions() {
    const start = Date.now();
    let ok = 0;
    let failed = 0;

    try {
      const now = new Date();
      const dueSubs = await this.prisma.productSubscription.findMany({
        where: {
          status: 'ACTIVE',
          next_delivery_at: { lte: now },
        },
        include: {
          product: { select: { id: true, name: true, price: true, is_active: true, stock: true } },
          member: { select: { id: true, user_id: true, gym_id: true, first_name: true } },
        },
      });

      for (const sub of dueSubs) {
        try {
          if (!sub.product.is_active) {
            await this.prisma.productSubscription.update({
              where: { id: sub.id },
              data: { status: 'PAUSED', notes: 'Producto ya no está activo' },
            });
            await this.notif.create({
              gymId: sub.member.gym_id,
              userId: sub.member.user_id,
              type: 'SUBSCRIPTION_PAUSED',
              title: '⚠️ Suscripción pausada',
              body: `Tu suscripción a ${sub.product.name} se pausó porque el producto ya no está disponible.`,
              data: { subscription_id: sub.id },
            });
            failed++;
            continue;
          }

          const unitPrice = Number(sub.product.price);
          const subtotal = unitPrice * sub.quantity;

          // Crear orden + item en una transacción
          const order = await this.prisma.$transaction(async (tx) => {
            return tx.marketplaceOrder.create({
              data: {
                gym_id: sub.member.gym_id,
                member_id: sub.member.id,
                status: 'PENDING',
                total: subtotal,
                notes: `Auto-creada por suscripción #${sub.id}`,
                items: {
                  create: [
                    {
                      product_id: sub.product.id,
                      quantity: sub.quantity,
                      unit_price: unitPrice,
                      subtotal,
                    },
                  ],
                },
              },
            });
          });

          // Reagendar próxima entrega
          const nextDate = new Date(sub.next_delivery_at);
          nextDate.setDate(nextDate.getDate() + sub.frequency_days);
          await this.prisma.productSubscription.update({
            where: { id: sub.id },
            data: {
              next_delivery_at: nextDate,
              last_delivered_at: now,
              total_deliveries: { increment: 1 },
            },
          });

          // Notificar al miembro
          await this.notif.create({
            gymId: sub.member.gym_id,
            userId: sub.member.user_id,
            type: 'SUBSCRIPTION_ORDER_CREATED',
            title: '📦 Tu suscripción está lista',
            body: `Generamos tu orden de ${sub.quantity}× ${sub.product.name}. Pasa por el gym a recogerla.`,
            data: { order_id: order.id, subscription_id: sub.id },
          });

          ok++;
        } catch (err) {
          failed++;
          this.logger.warn(`subscription ${sub.id} failed: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`product-subscriptions crashed: ${(err as Error).message}`);
    }

    this.record({
      job: 'product-subscriptions',
      ran_at: new Date(),
      duration_ms: Date.now() - start,
      ok,
      failed,
    });
    this.logger.log(`product-subscriptions: ${ok} orders created · ${failed} failed`);
  }

  // ─── F4a: Análisis adaptativo IA semanal (lunes 8am) ─────────────────────
  @Cron('0 8 * * 1', { name: 'adaptive-plan-weekly', timeZone: 'America/El_Salvador' })
  async runAdaptivePlans() {
    const start = Date.now();
    let ok = 0;
    let failed = 0;

    try {
      // Solo miembros con tier ELITE
      const eliteAddons = await this.prisma.memberAddon.findMany({
        where: { status: 'ACTIVE', tier: 'ELITE', type: 'NUTRITION' },
        include: {
          member: { select: { id: true, gym_id: true, user_id: true } },
        },
      });

      for (const addon of eliteAddons) {
        try {
          const res = await this.nutrition.adaptivePlanAnalysis(
            addon.member.gym_id,
            addon.member.id,
          );
          if (res.success && res.analysis) {
            await this.notif.create({
              gymId: addon.member.gym_id,
              userId: addon.member.user_id,
              type: 'ADAPTIVE_PLAN_READY',
              title: '🧬 Tu análisis semanal está listo',
              body: res.analysis.headline,
              data: { plan_id: res.plan_id, verdict: res.analysis.verdict },
            });
            ok++;
          }
        } catch (err) {
          failed++;
          this.logger.warn(
            `adaptive-plan for member ${addon.member.id}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`adaptive-plan-weekly crashed: ${(err as Error).message}`);
    }

    this.record({
      job: 'adaptive-plan-weekly',
      ran_at: new Date(),
      duration_ms: Date.now() - start,
      ok,
      failed,
    });
    this.logger.log(`adaptive-plan-weekly: ${ok} ok · ${failed} failed`);
  }

  // ─── F4b: Dunning de pagos fallidos (diario 9am) ─────────────────────────
  // Para pagos FAILED, escalación según días desde el fallo:
  //   día 0: ya se notificó al cobrar
  //   día 3, 5, 7: reintento + notif
  //   día 14: cancelación automática + notif final
  @Cron('0 9 * * *', { name: 'dunning-daily', timeZone: 'America/El_Salvador' })
  async runDunning() {
    const start = Date.now();
    let ok = 0;
    let failed = 0;

    try {
      const now = new Date();
      const since14 = new Date(now);
      since14.setDate(since14.getDate() - 14);

      const failedPayments = await this.prisma.payment.findMany({
        where: {
          status: 'FAILED',
          created_at: { gte: since14 },
        },
        include: {
          member: { select: { id: true, user_id: true, gym_id: true, first_name: true } },
          membership: {
            include: { type: { select: { name: true, price: true } } },
          },
        },
      });

      for (const p of failedPayments) {
        try {
          const daysSince = Math.floor((now.getTime() - p.created_at.getTime()) / 86_400_000);

          let stage: 0 | 3 | 5 | 7 | 14 | null = null;
          if (daysSince === 3) stage = 3;
          else if (daysSince === 5) stage = 5;
          else if (daysSince === 7) stage = 7;
          else if (daysSince >= 14) stage = 14;
          if (stage === null) continue;

          const planName = p.membership?.type?.name ?? 'tu membresía';
          const amount = Number(p.amount).toFixed(2);

          if (stage === 14) {
            // Cancelación automática + notificación final
            if (p.membership) {
              await this.prisma.membership.update({
                where: { id: p.membership.id },
                data: {
                  status: 'CANCELLED',
                  cancelled_at: now,
                  cancel_reason: 'Auto: 14 días sin pago',
                },
              });
              await this.prisma.member.update({
                where: { id: p.member.id },
                data: { status: 'CANCELLED' },
              });
            }
            await this.notif.create({
              gymId: p.member.gym_id,
              userId: p.member.user_id,
              type: 'DUNNING_CANCELLED',
              title: '❌ Tu membresía fue cancelada',
              body: `${p.member.first_name}, han pasado 14 días sin completar el pago de $${amount}. Tu membresía está cancelada — contacta al gym para reactivar.`,
              data: { payment_id: p.id, amount },
            });
          } else {
            const messages: Record<3 | 5 | 7, { title: string; body: string }> = {
              3: {
                title: '💳 Pago pendiente',
                body: `${p.member.first_name}, no logramos cobrar $${amount} de ${planName}. Verifica tu método de pago.`,
              },
              5: {
                title: '⚠️ Pago aún pendiente',
                body: `${p.member.first_name}, llevamos 5 días intentando cobrar $${amount}. Tu acceso podría bloquearse pronto.`,
              },
              7: {
                title: '🚨 Última advertencia',
                body: `${p.member.first_name}, hoy se bloquea tu acceso por $${amount} sin pagar. Si pagas hoy, no perdés nada.`,
              },
            };
            await this.notif.create({
              gymId: p.member.gym_id,
              userId: p.member.user_id,
              type: `DUNNING_DAY_${stage}`,
              title: messages[stage].title,
              body: messages[stage].body,
              data: { payment_id: p.id, amount, days_since: daysSince },
            });

            // Al día 7 también bloqueamos el acceso (status PRE_CANCEL)
            if (stage === 7) {
              await this.prisma.member.update({
                where: { id: p.member.id },
                data: { status: 'PRE_CANCEL' },
              });
            }
          }
          ok++;
        } catch (err) {
          failed++;
          this.logger.warn(`dunning for payment ${p.id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`dunning-daily crashed: ${(err as Error).message}`);
    }

    this.record({
      job: 'dunning-daily',
      ran_at: new Date(),
      duration_ms: Date.now() - start,
      ok,
      failed,
    });
    this.logger.log(`dunning-daily: ${ok} processed · ${failed} failed`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private mealLabel(meal: string) {
    return { BREAKFAST: 'desayuno', LUNCH: 'almuerzo', DINNER: 'cena' }[meal] ?? 'comida';
  }

  // ─── Manual triggers (admin/super-admin debugging) ────────────────────────
  async triggerJob(job: 'meals' | 'subscriptions' | 'adaptive' | 'dunning') {
    if (job === 'meals') await this.runMealReminders();
    else if (job === 'subscriptions') await this.runProductSubscriptions();
    else if (job === 'adaptive') await this.runAdaptivePlans();
    else if (job === 'dunning') await this.runDunning();
    return { job, recent_runs: this.recentRuns.slice(0, 5) };
  }
}
