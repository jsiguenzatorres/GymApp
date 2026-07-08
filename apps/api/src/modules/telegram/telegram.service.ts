import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { CrmService } from '../crm/crm.service';

const LINK_CODE_TTL_MS = 10 * 60_000; // 10 minutos

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { username?: string };
    text?: string;
  };
}

// Bot único compartido por toda la plataforma — la vinculación cuenta con la
// distinción por gym/member (no un bot por gym, a diferencia de WhatsApp que
// usa el número real de cada gym). Ver ADR-008 (agentes IA white-label) para
// una eventual evolución a bot-por-gym si se necesita branding propio.
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string | undefined;
  private readonly botUsername: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.botUsername = this.config.get<string>('TELEGRAM_BOT_USERNAME');
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN no configurado — Telegram quedará stubbed');
    }
  }

  get isEnabled(): boolean {
    return Boolean(this.botToken);
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) {
        this.logger.error(`Telegram sendMessage ${res.status}: ${await res.text()}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Telegram sendMessage error: ${(err as Error).message}`);
      return false;
    }
  }

  // Genera (o renueva) un código de 6 dígitos para que el miembro vincule su
  // cuenta enviando "/start CODIGO" al bot desde su Telegram.
  async generateLinkCode(gymId: string, memberId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);

    await this.prisma.telegramLink.upsert({
      where: { member_id: memberId },
      create: {
        gym_id: gymId,
        member_id: memberId,
        link_code: code,
        link_code_expires_at: expiresAt,
      },
      update: {
        link_code: code,
        link_code_expires_at: expiresAt,
      },
    });

    return {
      code,
      expiresAt,
      deepLink: this.botUsername ? `https://t.me/${this.botUsername}?start=${code}` : null,
    };
  }

  async getLinkStatus(gymId: string, memberId: string) {
    const link = await this.prisma.telegramLink.findFirst({
      where: { gym_id: gymId, member_id: memberId },
    });
    return {
      linked: Boolean(link?.telegram_chat_id),
      telegramUsername: link?.telegram_username ?? null,
    };
  }

  async unlink(gymId: string, memberId: string) {
    await this.prisma.telegramLink.updateMany({
      where: { gym_id: gymId, member_id: memberId },
      data: { telegram_chat_id: null, telegram_username: null, linked_at: null },
    });
  }

  // ─── Webhook entrante ───────────────────────────────────────────────────────

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;
    if (!message?.text) return;

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    if (text.startsWith('/start')) {
      const code = text.replace('/start', '').trim();
      if (!code) {
        await this.sendMessage(
          chatId,
          'Hola 👋 Para vincular tu cuenta, genera un código desde la app de tu gym (Ajustes → Telegram) y envíamelo con /start CODIGO.',
        );
        return;
      }
      await this.tryLinkByCode(chatId, code, message.from?.username);
      return;
    }

    const link = await this.prisma.telegramLink.findFirst({ where: { telegram_chat_id: chatId } });
    if (!link) {
      await this.sendMessage(
        chatId,
        'Aún no vinculas tu cuenta. Genera un código desde la app (Ajustes → Telegram) y envíamelo con /start CODIGO.',
      );
      return;
    }

    try {
      const { response } = await this.crm.ariaChat(link.gym_id, link.member_id, text);
      await this.sendMessage(chatId, response);
    } catch (err) {
      this.logger.error(`Telegram ariaChat error: ${(err as Error).message}`);
      await this.sendMessage(chatId, 'Lo siento, tuve un problema respondiendo. Intenta de nuevo.');
    }
  }

  private async tryLinkByCode(chatId: string, code: string, username: string | undefined) {
    const link = await this.prisma.telegramLink.findFirst({
      where: { link_code: code, link_code_expires_at: { gte: new Date() } },
    });
    if (!link) {
      await this.sendMessage(chatId, 'Código inválido o vencido. Genera uno nuevo desde la app.');
      return;
    }

    await this.prisma.telegramLink.update({
      where: { id: link.id },
      data: {
        telegram_chat_id: chatId,
        telegram_username: username,
        link_code: null,
        link_code_expires_at: null,
        linked_at: new Date(),
      },
    });

    await this.sendMessage(
      chatId,
      '✅ ¡Listo! Tu cuenta quedó vinculada. Ya puedes escribirme cualquier duda y te responderá ARIA.',
    );
  }
}
