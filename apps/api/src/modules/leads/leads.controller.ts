import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeadsService, CreateLeadDto, UpdateLeadDto } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  private gymId(user: JwtPayload): string {
    return user.gymId ?? '';
  }

  @Get()
  getAll(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.leadsService.getAll(this.gymId(user), status);
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.leadsService.getStats(this.gymId(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(this.gymId(user), dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(this.gymId(user), id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.leadsService.remove(this.gymId(user), id);
  }
}
