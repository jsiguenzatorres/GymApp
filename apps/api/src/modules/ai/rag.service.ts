import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from './gemini.service';

interface KnowledgeChunk {
  content: string;
  type: string;
  source: string | null;
  similarity: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async embedText(text: string): Promise<number[] | null> {
    try {
      return await this.gemini.embedText(text);
    } catch (err) {
      this.logger.error(`Embedding error: ${(err as Error).message}`);
      return null;
    }
  }

  async storeKnowledge(
    gymId: string,
    content: string,
    type: string,
    source?: string,
  ): Promise<void> {
    const embedding = await this.embedText(content);
    if (embedding) {
      const embeddingStr = `[${embedding.join(',')}]`;
      await this.prisma.$executeRaw`
        INSERT INTO gym_knowledge (id, gym_id, content, embedding, type, source, is_active, created_at)
        VALUES (gen_random_uuid(), ${gymId}::uuid, ${content}, ${embeddingStr}::vector, ${type}, ${source ?? null}, true, NOW())
        ON CONFLICT DO NOTHING
      `;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO gym_knowledge (id, gym_id, content, type, source, is_active, created_at)
        VALUES (gen_random_uuid(), ${gymId}::uuid, ${content}, ${type}, ${source ?? null}, true, NOW())
      `;
    }
  }

  async searchSimilar(gymId: string, query: string, limit = 5): Promise<KnowledgeChunk[]> {
    const embedding = await this.embedText(query);
    if (!embedding) return [];

    const embeddingStr = `[${embedding.join(',')}]`;
    try {
      const results = await this.prisma.$queryRaw<KnowledgeChunk[]>`
        SELECT content, type, source,
               (1 - (embedding <=> ${embeddingStr}::vector))::float as similarity
        FROM gym_knowledge
        WHERE gym_id = ${gymId}::uuid
          AND is_active = true
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `;
      return results.filter((r) => r.similarity > 0.55);
    } catch (err) {
      this.logger.error(`Vector search error: ${(err as Error).message}`);
      return [];
    }
  }

  async buildContext(gymId: string, query: string): Promise<string> {
    const gymChunks = await this.searchSimilar(gymId, query);
    if (gymChunks.length === 0) return '';
    const lines = gymChunks.map((c) => `[${c.type}] ${c.content}`);
    return `\nCONOCIMIENTO RELEVANTE DEL GYM:\n${lines.join('\n')}\n`;
  }

  async buildZeusContext(gymId: string, query: string, scienceChunks: string[]): Promise<string> {
    const gymChunks = await this.searchSimilar(gymId, query);
    const parts: string[] = [];

    if (gymChunks.length > 0) {
      const gymLines = gymChunks.map((c) => `[${c.type}] ${c.content}`);
      parts.push(`CONOCIMIENTO DEL GYM:\n${gymLines.join('\n')}`);
    }

    if (scienceChunks.length > 0) {
      parts.push(`INVESTIGACIÓN CIENTÍFICA:\n${scienceChunks.join('\n')}`);
    }

    return parts.length > 0 ? `\n${parts.join('\n\n')}\n` : '';
  }

  async seedGymKnowledge(gymId: string): Promise<{ seeded: number }> {
    const [gym, exercises, classTypes, staff] = await Promise.all([
      this.prisma.gym.findUnique({ where: { id: gymId } }),
      this.prisma.exercise.findMany({ where: { gym_id: gymId, is_active: true }, take: 50 }),
      this.prisma.classType.findMany({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.staff.findMany({ where: { gym_id: gymId, is_active: true } }),
    ]);

    const items: { content: string; type: string; source: string }[] = [];

    if (gym) {
      items.push({
        content: `El gym se llama "${gym.name}". País: ${gym.country}. Moneda: ${gym.currency}. ${gym.description ?? ''}`,
        type: 'FAQ',
        source: 'gym_profile',
      });
      if (gym.phone)
        items.push({
          content: `Teléfono del gym: ${gym.phone}`,
          type: 'FAQ',
          source: 'gym_contact',
        });
      if (gym.email)
        items.push({ content: `Email del gym: ${gym.email}`, type: 'FAQ', source: 'gym_contact' });
      if (gym.address)
        items.push({
          content: `Dirección del gym: ${gym.address}, ${gym.city ?? ''}`,
          type: 'FAQ',
          source: 'gym_contact',
        });
    }

    exercises.forEach((e) => {
      const muscles = Array.isArray(e.muscle_groups)
        ? (e.muscle_groups as string[]).join(', ')
        : '';
      items.push({
        content: `Ejercicio: ${e.name}. Músculos trabajados: ${muscles}. Equipo: ${e.equipment ?? 'sin equipo especial'}. ${e.instructions ?? ''}`,
        type: 'EXERCISE',
        source: 'exercise_library',
      });
    });

    classTypes.forEach((c) => {
      items.push({
        content: `Clase grupal disponible: ${c.name}. Duración: ${c.duration_minutes} minutos. ${c.description ?? ''}`,
        type: 'SCHEDULE',
        source: 'class_types',
      });
    });

    staff.forEach((s) => {
      items.push({
        content: `Trainer/Staff: ${s.first_name} ${s.last_name}. Especialidades: ${s.specialties.join(', ')}.`,
        type: 'STAFF',
        source: 'staff_directory',
      });
    });

    let seeded = 0;
    for (const item of items) {
      try {
        await this.storeKnowledge(gymId, item.content, item.type, item.source);
        seeded++;
      } catch {}
    }

    return { seeded };
  }
}
