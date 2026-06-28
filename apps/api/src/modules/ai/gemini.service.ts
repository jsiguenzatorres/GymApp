import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const RETRYABLE_CODES = [429, 500, 503];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly keys: string[];
  private currentKeyIndex = 0;

  constructor(private readonly config: ConfigService) {
    const keys: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const k = this.config.get<string>(`GEMINI_API_KEY${i}`);
      if (k) keys.push(k);
    }
    if (keys.length === 0) {
      this.logger.warn('No GEMINI_API_KEY configured — AI features will fail');
    }
    this.keys = keys;
    this.logger.log(`GeminiService initialized with ${keys.length} API key(s)`);
  }

  private getModel(modelName = 'gemini-2.0-flash-lite'): GenerativeModel {
    const key = this.keys[this.currentKeyIndex];
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
  }

  private rotateKey(): boolean {
    if (this.keys.length <= 1) return false;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    this.logger.warn(`Rotated to Gemini key index ${this.currentKeyIndex}`);
    return true;
  }

  async chat(
    systemPrompt: string,
    userMessage: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
    model = 'gemini-2.0-flash-lite',
  ): Promise<string> {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }

    let attempts = 0;
    const maxAttempts = this.keys.length;

    while (attempts < maxAttempts) {
      try {
        const genModel = this.getModel(model);

        const chat = genModel.startChat({
          systemInstruction: systemPrompt,
          history,
        });

        const result = await chat.sendMessage(userMessage);
        const text = result.response.text();
        return text;
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status ?? 0;
        const message = (err as Error)?.message ?? '';
        const isQuota =
          RETRYABLE_CODES.includes(status) ||
          message.includes('quota') ||
          message.includes('RESOURCE_EXHAUSTED');

        if (isQuota && this.rotateKey()) {
          attempts++;
          this.logger.warn(
            `Gemini quota/error (${status}) — retrying with next key (attempt ${attempts}/${maxAttempts})`,
          );
          continue;
        }

        this.logger.error(`Gemini error: ${message}`);
        throw err;
      }
    }

    throw new Error('All Gemini API keys exhausted or rate-limited');
  }

  async generate(prompt: string, model = 'gemini-2.0-flash-lite'): Promise<string> {
    return this.chat('', prompt, [], model);
  }

  // Multimodal: image + text → text response
  async generateWithImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    model = 'gemini-2.0-flash-lite',
  ): Promise<string> {
    if (this.keys.length === 0) throw new Error('No Gemini API keys configured');

    // Strip data URI prefix if present
    const cleanBase64 = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;

    let attempts = 0;
    while (attempts < this.keys.length) {
      try {
        const genModel = this.getModel(model);
        const result = await genModel.generateContent([
          { inlineData: { data: cleanBase64, mimeType } },
          prompt,
        ]);
        return result.response.text();
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status ?? 0;
        const message = (err as Error)?.message ?? '';
        const isQuota =
          RETRYABLE_CODES.includes(status) ||
          message.includes('quota') ||
          message.includes('RESOURCE_EXHAUSTED');
        if (isQuota && this.rotateKey()) {
          attempts++;
          continue;
        }
        this.logger.error(`Gemini vision error: ${message}`);
        throw err;
      }
    }
    throw new Error('All Gemini API keys exhausted or rate-limited');
  }
}
