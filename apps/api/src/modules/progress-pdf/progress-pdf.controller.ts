import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ProgressPdfService } from './progress-pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Controller('members/me')
@UseGuards(JwtAuthGuard)
export class ProgressPdfController {
  constructor(
    private readonly svc: ProgressPdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('progress-pdf')
  async download(
    @CurrentUser() user: JwtPayload,
    @Query('month') month: string | undefined,
    @Res() res: Response,
  ) {
    const member = await this.prisma.member.findFirst({ where: { user_id: user.sub } });
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }
    const buffer = await this.svc.generateMonthly(member.gym_id, member.id, month);
    const filename = `progreso-${month ?? new Date().toISOString().slice(0, 7)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.end(buffer);
  }
}
