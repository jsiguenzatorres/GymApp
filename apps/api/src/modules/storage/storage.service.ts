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

// Imagen o PDF — usado por lab results (D-29): Gemini soporta PDF nativo via inlineData,
// no requiere conversión a imagen.
const ALLOWED_DOCUMENT_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024; // 8 MB — documentos escaneados, no solo fotos

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

  // Sube foto de un alimento de la biblioteca de nutrición al bucket
  // 'food-images' — público, no es dato sensible (igual que product-images).
  uploadFoodItemImage(gymId: string, dataUri: string) {
    return this.uploadImage('food-images', gymId, dataUri);
  }

  // Decodifica un data-URI base64 de imagen O PDF y retorna { buffer, mimeType }.
  private parseDocumentDataUri(dataUri: string): { buffer: Buffer; mimeType: string } {
    const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,(.+)$/i.exec(
      dataUri.trim(),
    );
    if (!match) {
      throw new BadRequestException(
        'Formato inválido. Usa data:image/{jpeg|png|webp};base64,... o data:application/pdf;base64,...',
      );
    }
    const mimeType = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) throw new BadRequestException('Documento vacío');
    if (buffer.length > MAX_DOCUMENT_BYTES) {
      throw new BadRequestException(
        `Documento muy grande: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (máx ${MAX_DOCUMENT_BYTES / 1024 / 1024}MB)`,
      );
    }
    return { buffer, mimeType };
  }

  // Sube una imagen O PDF (ej. examen de laboratorio, comprobante de pago) a
  // un bucket PRIVADO — devuelve la ruta interna, no una URL. Estos buckets
  // guardan datos sensibles (médicos, financieros/NIT/DUI), así que la URL de
  // lectura se genera aparte, firmada y con expiración (ver getSignedUrl).
  async uploadDocument(
    bucket: string,
    pathPrefix: string,
    dataUri: string,
  ): Promise<{ path: string; sizeBytes: number; mimeType: string }> {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new InternalServerErrorException(
        'Storage no configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    const { buffer, mimeType } = this.parseDocumentDataUri(dataUri);
    if (!ALLOWED_DOCUMENT_MIME.includes(mimeType)) {
      throw new BadRequestException(`MIME no permitido: ${mimeType}`);
    }

    const ext =
      mimeType === 'application/pdf'
        ? 'pdf'
        : mimeType === 'image/jpeg'
          ? 'jpg'
          : mimeType.split('/')[1];
    const stamp = process.hrtime.bigint().toString(36);
    const path = `${pathPrefix}/${stamp}.${ext}`;

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!res.ok) {
      const errBody = await res.text();
      this.logger.error(
        `Supabase Storage upload de documento falló (${res.status}): ${errBody.slice(0, 300)}`,
      );
      throw new InternalServerErrorException(`Storage upload failed (${res.status})`);
    }

    return { path, sizeBytes: buffer.length, mimeType };
  }

  // Genera una URL firmada y temporal (expira en `expiresInSeconds`) para leer
  // un archivo de un bucket privado — usar en cada lectura, nunca guardar la
  // URL resultante de forma permanente.
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds = 3600,
  ): Promise<string | null> {
    if (!this.supabaseUrl || !this.serviceRoleKey) return null;

    const res = await fetch(`${this.supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!res.ok) {
      this.logger.error(`No se pudo firmar URL de ${bucket}/${path} (${res.status})`);
      return null;
    }

    const body = (await res.json()) as { signedURL: string };
    return `${this.supabaseUrl}/storage/v1${body.signedURL}`;
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
