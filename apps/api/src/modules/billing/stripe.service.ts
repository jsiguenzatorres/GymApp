import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null = null;
  private readonly webhookSecret: string | undefined;

  constructor(private readonly config: ConfigService) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (secretKey) {
      this.client = new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' });
      this.logger.log('Stripe client initialized');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe features will be stubbed');
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  // ─── Payment Intents ────────────────────────────────────────────────────────

  async createPaymentIntent(params: {
    amount: number; // cents
    currency: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
    if (!this.client) return null;

    const pi = await this.client.paymentIntents.create({
      amount: Math.round(params.amount * 100), // convert to cents
      currency: params.currency.toLowerCase(),
      metadata: params.metadata ?? {},
      description: params.description,
      automatic_payment_methods: { enabled: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { clientSecret: pi.client_secret!, paymentIntentId: pi.id };
  }

  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent | null> {
    if (!this.client) return null;
    return this.client.paymentIntents.retrieve(id);
  }

  // Reintento de cobro (dunning): cobra directo con un payment_method ya guardado,
  // sin que el miembro esté presente (off_session). Usado por DunningService.
  async chargeSavedPaymentMethod(params: {
    paymentMethodToken: string;
    amount: number; // cents no incluidos, en unidad de moneda (ej. 95.00)
    currency: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<{ succeeded: boolean; paymentIntentId: string | null; failureMessage?: string }> {
    if (!this.client)
      return { succeeded: false, paymentIntentId: null, failureMessage: 'Stripe no configurado' };

    try {
      const pi = await this.client.paymentIntents.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        payment_method: params.paymentMethodToken,
        confirm: true,
        off_session: true,
        metadata: params.metadata ?? {},
        description: params.description,
      });
      return { succeeded: pi.status === 'succeeded', paymentIntentId: pi.id };
    } catch (err) {
      const stripeErr = err as {
        code?: string;
        message?: string;
        payment_intent?: { id?: string };
      };
      return {
        succeeded: false,
        paymentIntentId: stripeErr.payment_intent?.id ?? null,
        failureMessage: stripeErr.message ?? 'Cobro rechazado',
      };
    }
  }

  // ─── Refunds ────────────────────────────────────────────────────────────────

  async createRefund(paymentIntentId: string, reason?: string): Promise<Stripe.Refund | null> {
    if (!this.client) return null;

    return this.client.refunds.create({
      payment_intent: paymentIntentId,
      reason: (reason as Stripe.RefundCreateParams.Reason) ?? 'requested_by_customer',
    });
  }

  // ─── Webhooks ───────────────────────────────────────────────────────────────

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event | null {
    if (!this.client || !this.webhookSecret) {
      this.logger.warn('[STRIPE] Webhook secret not configured — skipping signature verification');
      return null;
    }

    try {
      return this.client.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Stripe webhook signature verification failed: ${err}`);
      return null;
    }
  }
}
