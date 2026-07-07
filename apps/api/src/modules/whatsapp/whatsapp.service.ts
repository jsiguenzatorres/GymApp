import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Integración con WhatsApp Business Cloud API (Meta) — solo mensajería, sin
// llamadas de voz (alcance elegido explícitamente por el cliente). Sigue el
// mismo patrón de StripeService/MercadoPagoService: se degrada a stub cuando
// no hay credenciales configuradas, en vez de lanzar.
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string | undefined;
  private readonly accessToken: string | undefined;
  private readonly appSecret: string | undefined;
  private readonly apiVersion = 'v20.0';

  constructor(private readonly config: ConfigService) {
    this.phoneNumberId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = config.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.appSecret = config.get<string>('WHATSAPP_APP_SECRET');

    if (this.phoneNumberId && this.accessToken) {
      this.logger.log('WhatsApp Cloud API client initialized');
    } else {
      this.logger.warn(
        'WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN no configurados — WhatsApp quedará stubbed',
      );
    }
  }

  get isEnabled(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  // Plantilla pre-aprobada por Meta — único tipo de mensaje permitido fuera de
  // la ventana de servicio al cliente de 24h (ej. recordatorios, cobros, anuncios).
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    components?: unknown[],
  ): Promise<WhatsAppSendResult> {
    if (!this.isEnabled) return { success: false, error: 'WhatsApp no configurado' };

    return this.postMessage({
      messaging_product: 'whatsapp',
      to: this.normalizeNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components ? { components } : {}),
      },
    });
  }

  // Mensaje de texto libre — solo válido dentro de la ventana de 24h desde el
  // último mensaje entrante del miembro (regla de Meta, no se valida aquí).
  async sendTextMessage(to: string, body: string): Promise<WhatsAppSendResult> {
    if (!this.isEnabled) return { success: false, error: 'WhatsApp no configurado' };

    return this.postMessage({
      messaging_product: 'whatsapp',
      to: this.normalizeNumber(to),
      type: 'text',
      text: { body },
    });
  }

  private async postMessage(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        messages?: { id?: string }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        return { success: false, error: data.error?.message ?? `HTTP ${res.status}` };
      }
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (err) {
      this.logger.error(`Error enviando mensaje WhatsApp: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  // WhatsApp exige el número en formato E.164 sin "+" (ej. 50370001234).
  private normalizeNumber(raw: string): string {
    return raw.replace(/\D/g, '');
  }

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined): boolean {
    if (!this.appSecret || !signatureHeader?.startsWith('sha256=')) return false;

    const expected = createHmac('sha256', this.appSecret).update(rawBody).digest('hex');
    const provided = signatureHeader.slice('sha256='.length);

    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(provided, 'hex');
    if (expectedBuf.length !== providedBuf.length) return false;

    return timingSafeEqual(expectedBuf, providedBuf);
  }
}
