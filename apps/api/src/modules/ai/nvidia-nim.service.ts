import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface NimMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class NvidiaNimService {
  private readonly logger = new Logger(NvidiaNimService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('NVIDIA_NIM_API_KEY');
    // gemma-4-31b-it: chat estandar (no "razonamiento"), ~600-1500ms al primer
    // token vs 24-180s de los modelos Nemotron/MiniMax de razonamiento — la
    // latencia importa aqui porque ARIA/Business Coach responden en vivo.
    this.model = this.config.get<string>('NVIDIA_NIM_MODEL') ?? 'google/gemma-4-31b-it';
    if (!this.apiKey) {
      this.logger.warn('No NVIDIA_NIM_API_KEY — fallback a NVIDIA NIM deshabilitado');
    }
  }

  get isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(
    systemPrompt: string,
    userMessage: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('NVIDIA NIM no configurado (falta NVIDIA_NIM_API_KEY)');
    }

    const messages: NimMessage[] = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...history.map((h) => ({
        role: (h.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: h.parts.map((p) => p.text).join('\n'),
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`NVIDIA NIM ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('NVIDIA NIM: respuesta sin contenido');
    return text;
  }
}
