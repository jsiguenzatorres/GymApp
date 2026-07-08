import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'node:crypto';

// Amazon Polly vía su API REST firmada con SigV4 — sin SDK de AWS para no
// depender de instalar un paquete nuevo. Reemplaza a ElevenLabs (mismo motivo:
// Polly es ~4x más barato y tiene voces neuronales en español latino "Lupe"/
// "Pedro"; no se necesita clonación de voz para este proyecto).
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;
  private readonly region: string;
  private readonly defaultVoiceId: string;

  constructor(private readonly config: ConfigService) {
    this.accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = this.config.get<string>('AWS_REGION') ?? 'us-east-1';
    this.defaultVoiceId = this.config.get<string>('POLLY_VOICE_ID') ?? 'Lupe'; // es-US, neural, latino

    if (!this.accessKeyId || !this.secretAccessKey) {
      this.logger.warn('No AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY — TTS deshabilitado');
    }
  }

  get isAvailable(): boolean {
    return !!(this.accessKeyId && this.secretAccessKey);
  }

  async synthesize(text: string, voiceId?: string): Promise<Buffer | null> {
    if (!this.accessKeyId || !this.secretAccessKey) return null;

    const host = `polly.${this.region}.amazonaws.com`;
    const path = '/v1/speech';
    const body = JSON.stringify({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId ?? this.defaultVoiceId,
      Engine: 'neural',
      LanguageCode: 'es-US',
    });

    try {
      const headers = this.signRequest('POST', host, path, body);
      const res = await fetch(`https://${host}${path}`, { method: 'POST', headers, body });

      if (!res.ok) {
        this.logger.error(`Polly ${res.status}: ${await res.text()}`);
        return null;
      }

      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      this.logger.error(`TTS error: ${(err as Error).message}`);
      return null;
    }
  }

  // ─── AWS Signature Version 4 (firma manual, sin SDK) ───────────────────────

  private hmac(key: Buffer | string, data: string): Buffer {
    return createHmac('sha256', key).update(data, 'utf8').digest();
  }

  private sha256Hex(data: string): string {
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }

  private signRequest(
    method: string,
    host: string,
    path: string,
    body: string,
  ): Record<string, string> {
    const service = 'polly';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.slice(0, 8);

    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';
    const payloadHash = this.sha256Hex(body);

    const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders, payloadHash].join(
      '\n',
    );

    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = this.hmac(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = this.hmac(kDate, this.region);
    const kService = this.hmac(kRegion, service);
    const kSigning = this.hmac(kService, 'aws4_request');
    const signature = this.hmac(kSigning, stringToSign).toString('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'Content-Type': 'application/json',
      Host: host,
      'X-Amz-Date': amzDate,
      Authorization: authorization,
    };
  }
}
