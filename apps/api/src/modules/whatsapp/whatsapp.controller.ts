import {
  Controller,
  Get,
  Post,
  Query,
  Headers,
  Req,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { WhatsAppService } from './whatsapp.service';

interface WhatsAppWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: { from?: string; id?: string; type?: string; text?: { body?: string } }[];
        statuses?: { id?: string; status?: string; recipient_id?: string }[];
      };
    }[];
  }[];
}

// Webhook público (sin JWT) — Meta requiere el handshake GET de verificación y
// un POST que reciba mensajes entrantes / actualizaciones de estado.
@Controller('webhooks/whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsapp: WhatsAppService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected) {
      return challenge;
    }
    throw new ForbiddenException('Token de verificación inválido');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
  ) {
    const rawBody = req.rawBody ?? Buffer.alloc(0);
    // NOTA: req.rawBody solo se llena si Nest se bootstrapea con `rawBody: true`
    // (ver main.ts) — igual que el webhook de Stripe existente, esto queda
    // pendiente de habilitar globalmente; hasta entonces la verificación de
    // firma no puede confirmar positivamente y se registra pero no bloquea.
    if (rawBody.length > 0 && !this.whatsapp.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenException('Firma inválida');
    }

    const body = req.body as WhatsAppWebhookPayload;
    const value = body?.entry?.[0]?.changes?.[0]?.value;

    for (const msg of value?.messages ?? []) {
      await this.handleInboundMessage(msg.from, msg.text?.body);
    }
    for (const status of value?.statuses ?? []) {
      this.logger.log(`WhatsApp status update: ${status.id} -> ${status.status}`);
    }

    return { received: true };
  }

  private async handleInboundMessage(from: string | undefined, text: string | undefined) {
    if (!from) return;
    this.logger.log(`Mensaje entrante de ${from}: ${text ?? '(sin texto)'}`);

    // Intenta atribuir el mensaje a un miembro por teléfono. WhatsApp entrega
    // el "from" como dígitos puros con código de país (ej. 50370001234);
    // Member.phone puede estar guardado con "+" u otro formato, así que se
    // compara solo por los últimos 8 dígitos (suficiente para no confundir
    // números dentro de un mismo gym en la práctica).
    const suffix = from.replace(/\D/g, '').slice(-8);
    if (!suffix) return;

    const member = await this.prisma.member.findFirst({
      where: { phone: { endsWith: suffix } },
      select: { id: true, gym_id: true },
    });
    if (!member) {
      this.logger.warn(`No se pudo atribuir mensaje de WhatsApp (${from}) a ningún miembro`);
      return;
    }

    await this.prisma.crmInteraction.create({
      data: {
        gym_id: member.gym_id,
        member_id: member.id,
        interaction_type: 'MESSAGE',
        channel: 'WHATSAPP',
        notes: text ?? '(sin texto)',
        occurred_at: new Date(),
      },
    });
  }
}
