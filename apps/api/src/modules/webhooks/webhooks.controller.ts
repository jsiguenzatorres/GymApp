import { Controller, Get, Post, Param, Body, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { CrmService } from '../crm/crm.service';

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppValue {
  metadata?: { phone_number_id: string };
  messages?: WhatsAppMessage[];
}

interface WhatsAppWebhookBody {
  entry?: Array<{ changes?: Array<{ value?: WhatsAppValue }> }>;
}

interface TelegramWebhookBody {
  message?: {
    chat: { id: number };
    from?: { first_name?: string };
    text?: string;
  };
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

  // GET /api/v1/webhooks/whatsapp/:gymId — Meta verification challenge
  @Get('whatsapp/:gymId')
  verifyWhatsApp(
    @Param('gymId') _gymId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN') ?? 'gymapp_verify';
    if (mode === 'subscribe' && token === expected) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  // POST /api/v1/webhooks/whatsapp/:gymId — Incoming WhatsApp messages
  @Post('whatsapp/:gymId')
  async handleWhatsApp(
    @Param('gymId') gymId: string,
    @Body() body: WhatsAppWebhookBody,
    @Res() res: Response,
  ) {
    res.status(200).json({ status: 'ok' });

    try {
      const change = body.entry?.[0]?.changes?.[0];
      const value = change?.value;
      const messages = value?.messages;
      if (!messages?.length) return;

      const msg = messages[0];
      if (msg.type !== 'text' || !msg.text?.body) return;

      const from = msg.from;
      const text = msg.text.body;
      const phoneNumberId = value?.metadata?.phone_number_id ?? '';

      // Buscar miembro por teléfono (últimos 8 dígitos para compatibilidad)
      const member = await this.prisma.member.findFirst({
        where: {
          gym_id: gymId,
          phone: { endsWith: from.slice(-8) },
        },
        select: { id: true },
      });

      const { response } = await this.crm.ariaChat(gymId, member?.id ?? '', text);
      await this.sendWhatsApp(phoneNumberId, from, response);
    } catch (err) {
      this.logger.error(`WhatsApp webhook error: ${(err as Error).message}`);
    }
  }

  // POST /api/v1/webhooks/telegram/:gymId — Incoming Telegram messages
  @Post('telegram/:gymId')
  async handleTelegram(
    @Param('gymId') gymId: string,
    @Body() body: TelegramWebhookBody,
    @Res() res: Response,
  ) {
    res.status(200).json({ status: 'ok' });

    try {
      const msg = body.message;
      if (!msg?.text) return;

      const chatId = msg.chat.id;
      const text = msg.text;

      // En producción: buscar miembro por telegram_chat_id guardado en notas o campo adicional
      const member = await this.prisma.member.findFirst({
        where: { gym_id: gymId },
        select: { id: true },
      });

      const { response } = await this.crm.ariaChat(gymId, member?.id ?? '', text);
      await this.sendTelegram(chatId, response);
    } catch (err) {
      this.logger.error(`Telegram webhook error: ${(err as Error).message}`);
    }
  }

  private async sendWhatsApp(phoneNumberId: string, to: string, text: string) {
    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    if (!token || !phoneNumberId) return;

    try {
      await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      });
    } catch (err) {
      this.logger.error(`WhatsApp send error: ${(err as Error).message}`);
    }
  }

  private async sendTelegram(chatId: number, text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (err) {
      this.logger.error(`Telegram send error: ${(err as Error).message}`);
    }
  }
}
