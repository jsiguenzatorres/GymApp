import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly apiKey: string | undefined;
  private readonly defaultVoiceId = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs Rachel (multilingüe)

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ELEVENLABS_API_KEY');
    if (!this.apiKey) this.logger.warn('No ELEVENLABS_API_KEY — TTS deshabilitado');
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  async synthesize(text: string, voiceId?: string): Promise<Buffer | null> {
    if (!this.apiKey) return null;

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId ?? this.defaultVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (!res.ok) {
        this.logger.error(`ElevenLabs ${res.status}: ${await res.text()}`);
        return null;
      }

      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      this.logger.error(`TTS error: ${(err as Error).message}`);
      return null;
    }
  }
}
