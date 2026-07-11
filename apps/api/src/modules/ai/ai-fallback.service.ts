import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { NvidiaNimService } from './nvidia-nim.service';

export type ChatHistory = { role: 'user' | 'model'; parts: { text: string }[] }[];

export interface ChatFallbackResult {
  response: string;
  provider: 'gemini' | 'gemma' | 'qwen';
}

/**
 * Cadena de respaldo de 3 niveles para todos los asistentes de texto de GymApp
 * (ARIA, ZEUS, Business Coach, Nutrición IA, co-piloto del nutricionista):
 *   1. Gemini (primario) — el gym ya tiene varias API keys Pro, rara vez falla
 *   2. Gemma 4 31B vía NVIDIA NIM (secundario) — rápido, solo texto
 *   3. Qwen3.5 397B vía NVIDIA NIM (terciario) — más grande y multimodal,
 *      pero más lento; solo se intenta si los dos anteriores ya fallaron
 *
 * Detalle completo de por qué estos modelos y no otros en
 * docs/INVESTIGACION_MODELOS_IA_NVIDIA.md.
 *
 * NO cubre: visión (foto de comida/producto) ni OCR de laboratorio — esos
 * siguen dependiendo solo de Gemini (ver el mismo documento para el porqué).
 */
@Injectable()
export class AiFallbackService {
  private readonly logger = new Logger(AiFallbackService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly nvidiaNim: NvidiaNimService,
  ) {}

  async chat(
    systemPrompt: string,
    message: string,
    history: ChatHistory = [],
  ): Promise<ChatFallbackResult> {
    try {
      const response = await this.gemini.chat(systemPrompt, message, history);
      return { response, provider: 'gemini' };
    } catch (geminiErr) {
      this.logger.warn(`Gemini falló, intentando respaldo: ${(geminiErr as Error).message}`);

      if (!this.nvidiaNim.isEnabled) throw geminiErr;

      try {
        const response = await this.nvidiaNim.chat(systemPrompt, message, history);
        return { response, provider: 'gemma' };
      } catch (gemmaErr) {
        this.logger.warn(`Gemma (NVIDIA) también falló: ${(gemmaErr as Error).message}`);

        try {
          const response = await this.nvidiaNim.chatTertiary(systemPrompt, message, history);
          return { response, provider: 'qwen' };
        } catch (qwenErr) {
          this.logger.error(`Qwen (NVIDIA) también falló: ${(qwenErr as Error).message}`);
          throw geminiErr; // el error original de Gemini es el más relevante para logs/debug
        }
      }
    }
  }
}
