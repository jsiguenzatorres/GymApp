import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!this.apiKey) this.logger.warn('No OPENAI_API_KEY — STT deshabilitado');
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  async transcribe(audioBuffer: Buffer, mimeType = 'audio/m4a'): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('wav') ? 'wav' : 'm4a';
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: formData,
      });

      if (!res.ok) {
        this.logger.error(`Whisper ${res.status}: ${await res.text()}`);
        return null;
      }

      const data = (await res.json()) as { text: string };
      return data.text;
    } catch (err) {
      this.logger.error(`STT error: ${(err as Error).message}`);
      return null;
    }
  }
}
