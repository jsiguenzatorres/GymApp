import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly avatarsBucket: string;

  constructor(private readonly config: ConfigService) {
    this.supabaseUrl = (this.config.get<string>('SUPABASE_URL') ?? '').replace(/\/$/, '');
    this.serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    this.avatarsBucket = this.config.get<string>('SUPABASE_AVATARS_BUCKET') ?? 'avatars';

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      this.logger.warn(
        'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados — uploads fallarán',
      );
    }
  }

  // Decodifica un data-URI base64 y retorna { buffer, mimeType }
  private parseDataUri(dataUri: string): { buffer: Buffer; mimeType: string } {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(dataUri.trim());
    if (!match) {
      throw new BadRequestException('Formato inválido. Usa data:image/{jpeg|png|webp};base64,...');
    }
    const mimeType = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) throw new BadRequestException('Imagen vacía');
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException(
        `Imagen muy grande: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (máx 2MB)`,
      );
    }
    return { buffer, mimeType };
  }

  // Sube un avatar a Supabase Storage y retorna la URL pública.
  // Sobrescribe si ya existía (upsert) — siempre 1 avatar por miembro.
  async uploadAvatar(
    memberId: string,
    dataUri: string,
  ): Promise<{ url: string; sizeBytes: number; mimeType: string }> {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new InternalServerErrorException(
        'Storage no configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    const { buffer, mimeType } = this.parseDataUri(dataUri);
    if (!ALLOWED_IMAGE_MIME.includes(mimeType)) {
      throw new BadRequestException(`MIME no permitido: ${mimeType}`);
    }

    const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    // Cache-busting: incluir timestamp epoch para que el cliente refresque tras upload
    const stamp = process.hrtime.bigint().toString(36);
    const path = `${memberId}/${stamp}.${ext}`;

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.avatarsBucket}/${path}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
        'Cache-Control': 'public, max-age=86400',
      },
      body: buffer,
    });

    if (!res.ok) {
      const errBody = await res.text();
      this.logger.error(`Supabase Storage upload falló (${res.status}): ${errBody.slice(0, 300)}`);
      throw new InternalServerErrorException(`Storage upload failed (${res.status})`);
    }

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.avatarsBucket}/${path}`;
    return { url: publicUrl, sizeBytes: buffer.length, mimeType };
  }
}
