import { Controller, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { TtsService } from './tts.service';
import { SttService } from './stt.service';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@RequiresPlan('PRO', 'ELITE', 'ENTERPRISE')
@UseGuards(JwtAuthGuard, PlanGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly tts: TtsService,
    private readonly stt: SttService,
    private readonly rag: RagService,
  ) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // POST /api/v1/ai/tts
  // Body: { text: string, voiceId?: string }
  // Returns: { audio: base64string, mimeType: 'audio/mpeg' } | { error }
  @Post('tts')
  async synthesize(
    @Body() body: { text: string; voiceId?: string },
    @CurrentUser() _user: JwtPayload,
  ) {
    if (!body.text?.trim()) return { error: 'text requerido' };
    if (!this.tts.isAvailable) return { error: 'TTS no configurado — agrega ELEVENLABS_API_KEY' };

    const audio = await this.tts.synthesize(body.text.slice(0, 500), body.voiceId);
    if (!audio) return { error: 'Error al generar audio' };

    return { audio: audio.toString('base64'), mimeType: 'audio/mpeg' };
  }

  // POST /api/v1/ai/stt
  // Body: { audio: base64string, mimeType?: string }
  // Returns: { text: string } | { error }
  @Post('stt')
  async transcribe(
    @Body() body: { audio: string; mimeType?: string },
    @CurrentUser() _user: JwtPayload,
  ) {
    if (!body.audio) return { error: 'audio requerido (base64)' };
    if (!this.stt.isAvailable) return { error: 'STT no configurado — agrega OPENAI_API_KEY' };

    const buffer = Buffer.from(body.audio, 'base64');
    const text = await this.stt.transcribe(buffer, body.mimeType ?? 'audio/m4a');
    if (!text) return { error: 'Error al transcribir audio' };

    return { text };
  }

  // POST /api/v1/ai/rag/seed — genera embeddings desde datos existentes del gym
  @Post('rag/seed')
  seedKnowledge(@CurrentUser() user: JwtPayload) {
    return this.rag.seedGymKnowledge(this.gymId(user));
  }
}
