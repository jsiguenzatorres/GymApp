import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

export interface MpItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MpPayer {
  email: string;
  name?: string;
}

export interface MpPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig | null = null;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (token) {
      this.client = new MercadoPagoConfig({ accessToken: token, options: { timeout: 5000 } });
      this.logger.log('MercadoPago initialized');
    } else {
      this.logger.warn('MERCADOPAGO_ACCESS_TOKEN not set — MP payments disabled');
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  // ── Checkout Pro: crea preferencia y devuelve URL de pago ──────────────────

  async createPreference(
    items: MpItem[],
    payer: MpPayer,
    gymId: string,
    externalReference: string,
    backUrls?: { success?: string; failure?: string; pending?: string },
  ): Promise<MpPreferenceResult | null> {
    if (!this.client) return null;

    try {
      const prefClient = new Preference(this.client);
      const result = await prefClient.create({
        body: {
          items: items.map((i) => ({
            id: i.id,
            title: i.title,
            quantity: i.quantity,
            unit_price: i.unit_price,
            currency_id: i.currency_id ?? 'USD',
          })),
          payer: {
            email: payer.email,
            name: payer.name,
          },
          external_reference: externalReference,
          metadata: { gym_id: gymId },
          back_urls: {
            success: backUrls?.success ?? `${this.config.get('APP_URL') ?? ''}/payment/success`,
            failure: backUrls?.failure ?? `${this.config.get('APP_URL') ?? ''}/payment/failure`,
            pending: backUrls?.pending ?? `${this.config.get('APP_URL') ?? ''}/payment/pending`,
          },
          auto_return: 'approved',
          notification_url: `${this.config.get('API_URL') ?? ''}/api/v1/billing/mp/webhook`,
        },
      });

      return {
        preferenceId: result.id ?? '',
        initPoint: result.init_point ?? '',
        sandboxInitPoint: result.sandbox_init_point ?? '',
      };
    } catch (err) {
      this.logger.error(`MP createPreference error: ${(err as Error).message}`);
      return null;
    }
  }

  // ── Consultar estado de un pago ───────────────────────────────────────────

  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    statusDetail: string;
    amount: number;
    externalReference: string;
  } | null> {
    if (!this.client) return null;

    try {
      const paymentClient = new Payment(this.client);
      const payment = await paymentClient.get({ id: Number(paymentId) });

      return {
        status: payment.status ?? 'unknown',
        statusDetail: payment.status_detail ?? '',
        amount: payment.transaction_amount ?? 0,
        externalReference: payment.external_reference ?? '',
      };
    } catch (err) {
      this.logger.error(`MP getPayment error: ${(err as Error).message}`);
      return null;
    }
  }

  // ── Procesar notificación webhook ─────────────────────────────────────────

  async processWebhook(body: {
    type?: string;
    data?: { id?: string };
    action?: string;
  }): Promise<{ paymentId: string; status: string; externalReference: string } | null> {
    if (!this.client) return null;

    // MP sends type='payment' for payment notifications
    if (body.type !== 'payment' && body.action !== 'payment.updated') return null;

    const paymentId = body.data?.id;
    if (!paymentId) return null;

    const info = await this.getPaymentStatus(paymentId);
    if (!info) return null;

    return { paymentId, status: info.status, externalReference: info.externalReference };
  }
}
