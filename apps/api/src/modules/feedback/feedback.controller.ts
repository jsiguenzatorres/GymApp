import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeedbackService, CreateFeedbackDto } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  private gymId(user: JwtPayload): string {
    return user.gymId ?? '';
  }

  @Get()
  getAll(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
    @Query('resolved') resolved?: string,
  ) {
    const isResolved = resolved === 'true' ? true : resolved === 'false' ? false : undefined;
    return this.feedbackService.getAll(this.gymId(user), type, isResolved);
  }

  @Get('nps-stats')
  getNpsStats(@CurrentUser() user: JwtPayload) {
    return this.feedbackService.getNpsStats(this.gymId(user));
  }

  @Get('open-complaints')
  getOpenComplaints(@CurrentUser() user: JwtPayload) {
    return this.feedbackService.getOpenComplaints(this.gymId(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(this.gymId(user), dto);
  }

  @Patch(':id/resolve')
  resolve(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.feedbackService.resolve(this.gymId(user), id);
  }
}
