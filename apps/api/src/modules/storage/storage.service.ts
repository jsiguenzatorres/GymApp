import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB — clip corto de tecnica, no pelicula

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

  // Genérico — sube una imagen a un bucket de Supabase Storage.
  // Se usa internamente por uploadAvatar y uploadProgressPhoto.
  async uploadImage(
    bucket: string,
    pathPrefix: string,
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
    const stamp = process.hrtime.bigint().toString(36);
    const path = `${pathPrefix}/${stamp}.${ext}`;

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${bucket}/${path}`;
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

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    return { url: publicUrl, sizeBytes: buffer.length, mimeType };
  }

  // Sube un avatar — sobrescribe (1 avatar por miembro).
  uploadAvatar(memberId: string, dataUri: string) {
    return this.uploadImage(this.avatarsBucket, memberId, dataUri);
  }

  // Sube una foto de progreso al bucket 'progress-photos' (configurable).
  uploadProgressPhoto(memberId: string, dataUri: string) {
    const bucket = this.config.get<string>('SUPABASE_PROGRESS_BUCKET') ?? 'progress-photos';
    return this.uploadImage(bucket, memberId, dataUri);
  }

  // Sube imagen de producto del marketplace al bucket 'product-images'.
  // Path lleva gym_id para aislamiento multi-tenant.
  uploadProductImage(gymId: string, dataUri: string) {
    const bucket = this.config.get<string>('SUPABASE_PRODUCTS_BUCKET') ?? 'product-images';
    return this.uploadImage(bucket, gymId, dataUri);
  }

  // Decodifica un data-URI base64 de VIDEO y retorna { buffer, mimeType }.
  // Separado de parseDataUri (imagenes) porque el limite de tamano y los
  // MIME permitidos son distintos.
  private parseVideoDataUri(dataUri: string): { buffer: Buffer; mimeType: string } {
    const match = /^data:(video\/(?:mp4|webm|quicktime));base64,(.+)$/i.exec(dataUri.trim());
    if (!match) {
      throw new BadRequestException(
        'Formato inválido. Usa data:video/{mp4|webm|quicktime};base64,...',
      );
    }
    const mimeType = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) throw new BadRequestException('Video vacío');
    if (buffer.length > MAX_VIDEO_BYTES) {
      throw new BadRequestException(
        `Video muy grande: ${(buffer.length / 1024 / 1024).toFixed(1)}MB (máx ${MAX_VIDEO_BYTES / 1024 / 1024}MB — sube un clip corto)`,
      );
    }
    return { buffer, mimeType };
  }

  // Sube un video corto (ej. demostracion de tecnica de un ejercicio propio
  // del gym) al bucket 'exercise-videos'. Path lleva gym_id para aislamiento.
  async uploadExerciseVideo(
    gymId: string,
    dataUri: string,
  ): Promise<{ url: string; sizeBytes: number; mimeType: string }> {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new InternalServerErrorException(
        'Storage no configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    const { buffer, mimeType } = this.parseVideoDataUri(dataUri);
    if (!ALLOWED_VIDEO_MIME.includes(mimeType)) {
      throw new BadRequestException(`MIME no permitido: ${mimeType}`);
    }

    const bucket = this.config.get<string>('SUPABASE_EXERCISE_VIDEOS_BUCKET') ?? 'exercise-videos';
    const ext = mimeType === 'video/quicktime' ? 'mov' : mimeType.split('/')[1];
    const stamp = process.hrtime.bigint().toString(36);
    const path = `${gymId}/${stamp}.${ext}`;

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${bucket}/${path}`;
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
      this.logger.error(
        `Supabase Storage upload de video falló (${res.status}): ${errBody.slice(0, 300)}`,
      );
      throw new InternalServerErrorException(`Storage upload failed (${res.status})`);
    }

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    return { url: publicUrl, sizeBytes: buffer.length, mimeType };
  }
}
