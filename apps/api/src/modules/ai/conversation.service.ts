import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface ConvMessage {
  role: 'user' | 'model';
  content: string;
  ts: string;
}

const MAX_HISTORY = 20;

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(
    gymId: string,
    memberId: string,
    agentType: 'ARIA' | 'ZEUS',
  ): Promise<ConvMessage[]> {
    try {
      const session = await this.prisma.conversationSession.findUnique({
        where: {
          gym_id_member_id_agent_type: {
            gym_id: gymId,
            member_id: memberId,
            agent_type: agentType,
          },
        },
      });
      return ((session?.messages as unknown as ConvMessage[]) ?? []).slice(-MAX_HISTORY);
    } catch {
      return [];
    }
  }

  async addMessages(
    gymId: string,
    memberId: string,
    agentType: 'ARIA' | 'ZEUS',
    userMsg: string,
    modelMsg: string,
  ): Promise<void> {
    if (!memberId) return;
    try {
      const existing = await this.getHistory(gymId, memberId, agentType);
      const now = new Date().toISOString();
      const updated = [
        ...existing,
        { role: 'user' as const, content: userMsg, ts: now },
        { role: 'model' as const, content: modelMsg, ts: now },
      ].slice(-MAX_HISTORY) as unknown as Prisma.InputJsonValue;

      await this.prisma.conversationSession.upsert({
        where: {
          gym_id_member_id_agent_type: {
            gym_id: gymId,
            member_id: memberId,
            agent_type: agentType,
          },
        },
        create: { gym_id: gymId, member_id: memberId, agent_type: agentType, messages: updated },
        update: { messages: updated },
      });
    } catch {}
  }

  toGeminiHistory(
    messages: ConvMessage[],
  ): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    return messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] }));
  }

  async clearHistory(gymId: string, memberId: string, agentType: 'ARIA' | 'ZEUS'): Promise<void> {
    try {
      await this.prisma.conversationSession.updateMany({
        where: { gym_id: gymId, member_id: memberId, agent_type: agentType },
        data: { messages: [] },
      });
    } catch {}
  }
}
