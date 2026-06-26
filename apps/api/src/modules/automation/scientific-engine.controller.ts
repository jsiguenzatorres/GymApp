import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@gymapp/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ScientificEngineService } from './scientific-engine.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.GYM_ADMIN, UserRole.GYM_OWNER)
@Controller('zeus/research')
export class ScientificEngineController {
  constructor(private readonly science: ScientificEngineService) {}

  @Get('stats')
  getStats() {
    return this.science.getStats();
  }

  @Get('queue')
  listQueue(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.science.listQueue(status, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('queue/:id')
  getQueueItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.science.getQueueItem(id);
  }

  // Manual trigger for the monthly monitor (admin testing / on-demand)
  @Post('monitor')
  @HttpCode(HttpStatus.ACCEPTED)
  triggerMonitor() {
    return this.science.triggerMonitor();
  }

  @Patch('queue/:id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.sub) throw new ForbiddenException('Sin usuario');
    return this.science.approve(id, user.sub);
  }

  @Patch('queue/:id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body('reason') reason: string,
  ) {
    if (!user.sub) throw new ForbiddenException('Sin usuario');
    return this.science.reject(id, user.sub, reason ?? 'Sin motivo especificado');
  }
}
