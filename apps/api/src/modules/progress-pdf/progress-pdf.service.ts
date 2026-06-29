import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../database/prisma.service';
import { NutritionService } from '../nutrition/nutrition.service';

@Injectable()
export class ProgressPdfService {
  private readonly logger = new Logger(ProgressPdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nutrition: NutritionService,
  ) {}

  async generateMonthly(gymId: string, memberId: string, monthIso?: string): Promise<Buffer> {
    // 1) Resolver rango del mes (YYYY-MM, default = mes actual)
    const now = new Date();
    const monthStr =
      monthIso ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, month] = monthStr.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      throw new NotFoundException('Mes inválido (formato YYYY-MM)');
    }
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // 2) Cargar datos en paralelo
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId },
      include: {
        gym: { select: { name: true, slug: true } },
      },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const [sessions, prs, weightLogs, badges] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where: {
          member_id: memberId,
          gym_id: gymId,
          finished_at: { gte: start, lte: end, not: null },
        },
        include: { sets: { select: { weight_kg: true, reps: true } } },
        orderBy: { started_at: 'asc' },
      }),
      this.prisma.personalRecord.findMany({
        where: { member_id: memberId, gym_id: gymId, achieved_at: { gte: start, lte: end } },
        include: { exercise: { select: { name: true } } },
        orderBy: { achieved_at: 'desc' },
      }),
      this.prisma.healthDataEntry.findMany({
        where: {
          member_id: memberId,
          kind: 'WEIGHT',
          recorded_at: { gte: start, lte: end },
        },
        orderBy: { recorded_at: 'asc' },
      }),
      this.prisma.memberBadge.findMany({
        where: { member_id: memberId, earned_at: { gte: start, lte: end } },
        include: { badge: { select: { name: true, icon: true } } },
      }),
    ]);

    const diary = await this.nutrition.getDiaryRange(
      gymId,
      memberId,
      this.daysInMonth(year, month),
    );

    // 3) Cálculos
    const totalVolume = sessions.reduce(
      (acc, s) =>
        acc + s.sets.reduce((a, set) => a + Number(set.weight_kg ?? 0) * (set.reps ?? 0), 0),
      0,
    );
    const totalSets = sessions.reduce((acc, s) => acc + s.sets.length, 0);
    const avgDurationMin =
      sessions.length > 0
        ? Math.round(sessions.reduce((a, s) => a + (s.duration_min ?? 0), 0) / sessions.length)
        : 0;
    const weightStart = weightLogs[0] ? Number(weightLogs[0].value) : null;
    const weightEnd = weightLogs[weightLogs.length - 1]
      ? Number(weightLogs[weightLogs.length - 1].value)
      : null;
    const weightDelta = weightStart !== null && weightEnd !== null ? weightEnd - weightStart : null;
    const daysLogged = diary.days_with_logs;
    const avgKcal = diary.avg_kcal;

    // 4) Generar PDF
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .fillColor('#1d4ed8')
        .text('Reporte mensual de progreso', { align: 'center' })
        .moveDown(0.3);
      doc
        .fontSize(11)
        .fillColor('#6b7280')
        .text(
          `${this.monthName(month)} ${year} · ${member.first_name} ${member.last_name} · ${member.gym?.name}`,
          { align: 'center' },
        )
        .moveDown(1.5);

      // Resumen ejecutivo
      this.section(doc, 'Resumen del mes');
      const summaryItems = [
        { label: 'Sesiones completadas', value: `${sessions.length}` },
        { label: 'Volumen total', value: `${Math.round(totalVolume).toLocaleString()} kg` },
        { label: 'Series ejecutadas', value: `${totalSets}` },
        { label: 'Duración promedio', value: `${avgDurationMin} min` },
        {
          label: 'Cambio de peso',
          value:
            weightDelta !== null
              ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg`
              : '—',
        },
        { label: 'Días con registro nutricional', value: `${daysLogged}` },
        { label: 'Kcal promedio', value: avgKcal > 0 ? `${avgKcal} kcal` : '—' },
        { label: 'Personal Records', value: `${prs.length}` },
      ];
      this.statGrid(doc, summaryItems);
      doc.moveDown(1);

      // Personal Records
      if (prs.length > 0) {
        this.section(doc, 'Personal Records del mes');
        prs.slice(0, 10).forEach((pr) => {
          doc
            .fontSize(11)
            .fillColor('#111827')
            .text(`• ${pr.exercise.name}: ${pr.value} ${pr.unit}`, { continued: false });
        });
        doc.moveDown(1);
      }

      // Logros
      if (badges.length > 0) {
        this.section(doc, 'Logros desbloqueados');
        badges.forEach((b) => {
          doc
            .fontSize(11)
            .fillColor('#111827')
            .text(`${b.badge.icon ?? '🏆'}  ${b.badge.name}`);
        });
        doc.moveDown(1);
      }

      // Sesiones (timeline)
      if (sessions.length > 0) {
        this.section(doc, 'Cronología de sesiones');
        sessions.slice(0, 20).forEach((s) => {
          const d = s.started_at.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' });
          const volume = s.sets.reduce(
            (a, set) => a + Number(set.weight_kg ?? 0) * (set.reps ?? 0),
            0,
          );
          doc
            .fontSize(10)
            .fillColor('#374151')
            .text(
              `${d} · ${s.name ?? 'Sesión'} · ${s.sets.length} sets · ${Math.round(volume)} kg`,
            );
        });
        if (sessions.length > 20) {
          doc
            .fontSize(9)
            .fillColor('#9ca3af')
            .text(`+ ${sessions.length - 20} sesiones más`);
        }
        doc.moveDown(1);
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Generado el ${now.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })} por GymApp`,
          50,
          doc.page.height - 60,
          { align: 'center', width: doc.page.width - 100 },
        );

      doc.end();
    });
  }

  private section(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(14).fillColor('#1d4ed8').text(title);
    doc
      .moveTo(50, doc.y + 2)
      .lineTo(doc.page.width - 50, doc.y + 2)
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);
  }

  private statGrid(doc: PDFKit.PDFDocument, items: Array<{ label: string; value: string }>) {
    const colWidth = (doc.page.width - 100) / 2;
    const rowHeight = 38;
    const startY = doc.y;
    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 50 + col * colWidth;
      const y = startY + row * rowHeight;
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text(item.label, x, y, { width: colWidth - 10 });
      doc
        .fontSize(15)
        .fillColor('#111827')
        .text(item.value, x, y + 12, { width: colWidth - 10 });
    });
    doc.y = startY + Math.ceil(items.length / 2) * rowHeight + 10;
  }

  private daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  private monthName(m: number) {
    return [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ][m - 1];
  }
}
