import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { RagService } from '../ai/rag.service';

interface PubMedPaper {
  pubmedId: string;
  title: string;
  authors: string[];
  journal: string;
  publishedDate: string;
  abstractText: string;
  doi: string;
}

interface AiAssessment {
  confidence: number;
  approval_level: number;
  keywords: string[];
  safety_flag: boolean;
  summary_es: string;
}

// Queries that cover the 5 journals + 5 tracked experts
const SEARCH_CONFIGS = [
  {
    query: 'muscle hypertrophy resistance training "Journal of Strength and Conditioning Research"',
    label: 'JSCR-hypertrophy',
  },
  {
    query: 'exercise physiology performance "Medicine and Science in Sports and Exercise"',
    label: 'MSSE-exercise',
  },
  {
    query:
      'sports nutrition protein supplementation "Journal of the International Society of Sports Nutrition"',
    label: 'JISSN-nutrition',
  },
  {
    query: 'strength training recovery "Sports Medicine"[journal]',
    label: 'SportsMed',
  },
  {
    query: 'periodization progression overload "Journal of Strength and Conditioning Research"',
    label: 'JSCR-periodization',
  },
  { query: 'Schoenfeld B[Author] hypertrophy', label: 'Schoenfeld' },
  { query: 'Galpin AJ[Author] performance', label: 'Galpin' },
  { query: 'Helms ER[Author] strength training', label: 'Helms' },
  { query: 'Norton LE[Author] protein muscle', label: 'Norton' },
  { query: 'McGill SM[Author] spine exercise', label: 'McGill' },
];

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

@Injectable()
export class ScientificEngineService {
  private readonly logger = new Logger(ScientificEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly rag: RagService,
  ) {}

  // ── Monthly automated research monitoring ───────────────────────────────────
  @Cron('0 8 1 * *')
  async monthlyMonitor() {
    this.logger.log('Scientific Engine: starting monthly PubMed monitor');
    let fetched = 0;
    let queued = 0;
    let autoApproved = 0;

    for (const config of SEARCH_CONFIGS) {
      try {
        const papers = await this.fetchFromPubMed(config.query);
        for (const paper of papers) {
          const result = await this.assessAndQueue(paper);
          fetched++;
          if (result === 'queued') queued++;
          if (result === 'auto_approved') {
            queued++;
            autoApproved++;
          }
        }
        // Small delay to respect NCBI 3 req/s limit
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        this.logger.error(`PubMed fetch error for ${config.label}: ${(err as Error).message}`);
      }
    }

    this.logger.log(
      `Scientific Engine: ${fetched} papers fetched, ${queued} queued, ${autoApproved} auto-approved`,
    );
  }

  // ── Manual trigger (for testing / admin button) ──────────────────────────────
  async triggerMonitor(): Promise<{ message: string }> {
    this.monthlyMonitor().catch((e) => this.logger.error(e.message));
    return { message: 'Monitor de investigación iniciado en background' };
  }

  // ── PubMed API ───────────────────────────────────────────────────────────────

  private async fetchFromPubMed(query: string): Promise<PubMedPaper[]> {
    // Step 1: search PMIDs (last 35 days)
    const searchUrl =
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed` +
      `&term=${encodeURIComponent(query)}` +
      `&sort=date&retmax=5&retmode=json&datetype=pdat&reldate=35`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`PubMed search HTTP ${searchRes.status}`);
    const searchData = (await searchRes.json()) as {
      esearchresult?: { idlist?: string[] };
    };
    const pmids = searchData.esearchresult?.idlist ?? [];
    if (!pmids.length) return [];

    // Step 2: fetch summaries
    const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = (await summaryRes.json()) as {
      result?: Record<
        string,
        {
          title?: string;
          authors?: { name: string }[];
          source?: string;
          pubdate?: string;
          elocationid?: string;
        }
      >;
    };

    const papers: PubMedPaper[] = [];

    for (const pmid of pmids) {
      try {
        const doc = summaryData.result?.[pmid];
        if (!doc?.title) continue;

        // Step 3: fetch abstract text
        const abstractUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`;
        await new Promise((r) => setTimeout(r, 350)); // rate limit
        const abstractRes = await fetch(abstractUrl);
        const abstractText = await abstractRes.text();

        papers.push({
          pubmedId: pmid,
          title: doc.title,
          authors: doc.authors?.map((a) => a.name) ?? [],
          journal: doc.source ?? 'Unknown Journal',
          publishedDate: doc.pubdate ?? '',
          abstractText: abstractText.trim().substring(0, 3000),
          doi: doc.elocationid ?? '',
        });
      } catch (err) {
        this.logger.warn(`Error fetching PMID ${pmid}: ${(err as Error).message}`);
      }
    }

    return papers;
  }

  // ── AI assessment and queue insertion ────────────────────────────────────────

  private async assessAndQueue(
    paper: PubMedPaper,
  ): Promise<'skipped' | 'queued' | 'auto_approved'> {
    // Skip if already in queue
    const existing = await this.prisma.researchQueue.findFirst({
      where: { pubmed_id: paper.pubmedId },
    });
    if (existing) return 'skipped';

    // Use Gemini to assess relevance and safety
    let ai: AiAssessment = {
      confidence: 0.5,
      approval_level: 2,
      keywords: [],
      safety_flag: false,
      summary_es: '',
    };

    try {
      const assessment = await this.gemini.generate(`
Evalúa este artículo científico para un sistema de entrenamiento de gimnasio (GymApp ZEUS).

Título: ${paper.title}
Autores: ${paper.authors.slice(0, 3).join(', ')}
Journal: ${paper.journal}
Resumen: ${paper.abstractText.substring(0, 800)}

Responde SOLO con JSON válido:
{
  "confidence": <número 0.0–1.0 de relevancia para fitness/gym>,
  "approval_level": <1|2|3|4 donde 1=seguro para auto-aprobar, 2=requiere admin, 3=admin+trainer, 4=profesional salud>,
  "keywords": ["kw1","kw2","kw3"],
  "safety_flag": <true si contiene claims médicos que requieren validación profesional>,
  "summary_es": "<resumen en español de 2-3 oraciones orientado al coach de gym>"
}

Criterios approval_level:
- 1: principios básicos de entrenamiento sin implicaciones médicas
- 2: técnicas avanzadas, suplementación general
- 3: periodización específica, modificaciones para poblaciones especiales
- 4: rehabilitación, lesiones, condiciones médicas, farmacología
`);

      const jsonMatch = assessment.match(/\{[\s\S]*\}/);
      if (jsonMatch) ai = JSON.parse(jsonMatch[0]) as AiAssessment;
    } catch {
      // Keep defaults on parse error
    }

    // Only queue papers with some relevance
    if (ai.confidence < 0.4) return 'skipped';

    const autoApprove = ai.confidence >= 0.85 && ai.approval_level === 1 && !ai.safety_flag;
    const status = autoApprove ? 'AUTO_APPROVED' : 'PENDING';

    const entry = await this.prisma.researchQueue.create({
      data: {
        title: paper.title,
        abstract_text: ai.summary_es || paper.abstractText.substring(0, 2000),
        raw_abstract: paper.abstractText.substring(0, 3000),
        authors: paper.authors.slice(0, 10),
        journal: paper.journal,
        pubmed_id: paper.pubmedId,
        doi: paper.doi,
        keywords: ai.keywords,
        approval_level: ai.approval_level,
        ai_confidence: ai.confidence,
        ai_assessment: `Confianza: ${(ai.confidence * 100).toFixed(0)}%. Nivel aprobación: ${ai.approval_level}. Safety: ${ai.safety_flag}.\n${ai.summary_es}`,
        status,
      },
    });

    if (autoApprove) {
      await this.embedAndApprove(entry.id, entry.abstract_text, entry.keywords);
    }

    return autoApprove ? 'auto_approved' : 'queued';
  }

  // ── Approval workflow ────────────────────────────────────────────────────────

  async listQueue(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.researchQueue.findMany({
        where,
        orderBy: [{ approval_level: 'asc' }, { created_at: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          authors: true,
          journal: true,
          approval_level: true,
          status: true,
          ai_confidence: true,
          ai_assessment: true,
          reviewed_at: true,
          created_at: true,
          pubmed_id: true,
          keywords: true,
        },
      }),
      this.prisma.researchQueue.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getQueueItem(id: string) {
    const item = await this.prisma.researchQueue.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item no encontrado en la cola');
    return item;
  }

  async approve(id: string, reviewerId: string): Promise<{ message: string }> {
    const item = await this.prisma.researchQueue.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item no encontrado');
    if (item.status === 'APPROVED' || item.status === 'AUTO_APPROVED') {
      throw new ForbiddenException('Ya fue aprobado');
    }

    await this.embedAndApprove(id, item.abstract_text, item.keywords, reviewerId);
    return { message: `"${item.title}" aprobado y añadido a la base de conocimiento científica` };
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<{ message: string }> {
    const item = await this.prisma.researchQueue.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item no encontrado');

    await this.prisma.researchQueue.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        rejection_reason: reason,
      },
    });
    return { message: 'Artículo rechazado' };
  }

  // ── Embed approved paper and store for ZEUS RAG ──────────────────────────────

  private async embedAndApprove(
    id: string,
    abstractText: string,
    keywords: string[],
    reviewerId?: string,
  ) {
    const embedding = await this.rag.embedText(
      `Investigación científica para gym: ${abstractText}. Keywords: ${keywords.join(', ')}`,
    );

    if (embedding) {
      const embStr = `[${embedding.join(',')}]`;
      await this.prisma.$executeRaw`
        UPDATE research_queue
        SET status = 'APPROVED',
            reviewed_by = ${reviewerId ?? null}::uuid,
            reviewed_at = NOW(),
            embedding = ${embStr}::vector
        WHERE id = ${id}::uuid
      `;
    } else {
      await this.prisma.researchQueue.update({
        where: { id },
        data: { status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date() },
      });
    }
  }

  // ── Scientific context for ZEUS (called from RagService.buildContext) ─────────

  async searchScientific(query: string, limit = 3): Promise<string[]> {
    const embedding = await this.rag.embedText(query);
    if (!embedding) return [];

    const embStr = `[${embedding.join(',')}]`;
    try {
      const results = await this.prisma.$queryRaw<
        {
          title: string;
          abstract_text: string;
          journal: string;
          similarity: number;
        }[]
      >`
        SELECT title, abstract_text, journal,
               (1 - (embedding <=> ${embStr}::vector))::float AS similarity
        FROM research_queue
        WHERE status IN ('APPROVED', 'AUTO_APPROVED')
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${embStr}::vector
        LIMIT ${limit}
      `;
      return results
        .filter((r) => r.similarity > 0.5)
        .map((r) => `[INVESTIGACIÓN CIENTÍFICA — ${r.journal}] ${r.abstract_text}`);
    } catch {
      return [];
    }
  }

  async getStats() {
    const [pending, approved, rejected, autoApproved, byLevel] = await Promise.all([
      this.prisma.researchQueue.count({ where: { status: 'PENDING' } }),
      this.prisma.researchQueue.count({ where: { status: 'APPROVED' } }),
      this.prisma.researchQueue.count({ where: { status: 'REJECTED' } }),
      this.prisma.researchQueue.count({ where: { status: 'AUTO_APPROVED' } }),
      this.prisma.researchQueue.groupBy({
        by: ['approval_level'],
        where: { status: 'PENDING' },
        _count: true,
      }),
    ]);
    return { pending, approved, rejected, autoApproved, byLevel };
  }
}
