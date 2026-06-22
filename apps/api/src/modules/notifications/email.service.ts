import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('EMAIL_FROM') ?? 'GymApp <noreply@gymapp.io>';

    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY not set — emails will only be logged');
    }
  }

  async send({ to, subject, html }: SendEmailParams): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to: [to], subject, html }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.logger.error(`Email send failed: ${JSON.stringify(err)}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string, tempPassword: string, gymName: string) {
    await this.send({
      to,
      subject: `Bienvenido a ${gymName} — tus credenciales de acceso`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2>¡Bienvenido, ${name}!</h2>
          <p>Tu cuenta en <strong>${gymName}</strong> ha sido creada.</p>
          <p>Accede a la app con estas credenciales:</p>
          <div style="background:#f4f4f8;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0"><strong>Email:</strong> ${to}</p>
            <p style="margin:8px 0 0"><strong>Contraseña temporal:</strong>
              <code style="background:#e8e8ef;padding:2px 6px;border-radius:4px">${tempPassword}</code>
            </p>
          </div>
          <p style="color:#888;font-size:13px">Cambia tu contraseña en el primer inicio de sesión.</p>
        </div>`,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string, frontendUrl: string) {
    const link = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    await this.send({
      to,
      subject: 'Restablecer contraseña — GymApp',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2>Restablecer contraseña</h2>
          <p>Hola ${name}, recibimos una solicitud para restablecer tu contraseña.</p>
          <a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">
            Cambiar contraseña
          </a>
          <p style="color:#888;font-size:13px">Este enlace expira en 30 minutos. Si no solicitaste esto, ignora este email.</p>
        </div>`,
    });
  }

  async sendAppointmentReminder(
    to: string,
    name: string,
    appointmentTitle: string,
    scheduledAt: Date,
    gymName: string,
  ) {
    const dateStr = scheduledAt.toLocaleDateString('es-SV', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    await this.send({
      to,
      subject: `Recordatorio de cita — ${appointmentTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2>Recordatorio de cita</h2>
          <p>Hola ${name}, te recordamos tu cita en <strong>${gymName}</strong>:</p>
          <div style="background:#f4f4f8;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0"><strong>${appointmentTitle}</strong></p>
            <p style="margin:8px 0 0;color:#555">${dateStr}</p>
          </div>
          <p style="color:#888;font-size:13px">Si no puedes asistir, comunícate con nosotros.</p>
        </div>`,
    });
  }
}
