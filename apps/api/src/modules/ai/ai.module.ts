import { Global, Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { RagService } from './rag.service';
import { TtsService } from './tts.service';
import { SttService } from './stt.service';
import { ConversationService } from './conversation.service';
import { NvidiaNimService } from './nvidia-nim.service';
import { AiController } from './ai.controller';
import { DatabaseModule } from '../database/database.module';
import { PlanGuard } from '../../common/guards/plan.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AiController],
  providers: [
    GeminiService,
    RagService,
    TtsService,
    SttService,
    ConversationService,
    NvidiaNimService,
    PlanGuard,
  ],
  exports: [
    GeminiService,
    RagService,
    TtsService,
    SttService,
    ConversationService,
    NvidiaNimService,
  ],
})
export class AiModule {}
