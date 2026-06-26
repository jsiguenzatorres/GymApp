import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { NutritionService } from './nutrition.service';
import { CreatePlanDto, CreateFoodItemDto, LogFoodDto, AiSuggestDto } from './dto/nutrition.dto';

@RequiresPlan('PRO', 'ELITE', 'ENTERPRISE')
@UseGuards(JwtAuthGuard, PlanGuard)
@Controller()
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // ─── STATS ────────────────────────────────────────────────────────────────────

  @Get('nutrition/stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.nutritionService.getNutritionStats(this.gymId(user));
  }

  // ─── PLANES ───────────────────────────────────────────────────────────────────

  @Get('nutrition-plans')
  listPlans(@CurrentUser() user: JwtPayload, @Query('memberId') memberId?: string) {
    return this.nutritionService.listPlans(this.gymId(user), memberId);
  }

  @Get('nutrition-plans/:id')
  getPlan(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.nutritionService.getPlan(this.gymId(user), id);
  }

  @Post('nutrition-plans')
  @HttpCode(HttpStatus.CREATED)
  createPlan(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlanDto) {
    return this.nutritionService.createPlan(this.gymId(user), dto);
  }

  @Patch('nutrition-plans/:id')
  updatePlan(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreatePlanDto>,
  ) {
    return this.nutritionService.updatePlan(this.gymId(user), id, dto);
  }

  @Delete('nutrition-plans/:id')
  deletePlan(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.nutritionService.deletePlan(this.gymId(user), id);
  }

  // ─── FOOD ITEMS ───────────────────────────────────────────────────────────────

  @Get('food-items')
  searchFoodItems(@CurrentUser() user: JwtPayload, @Query('search') search?: string) {
    return this.nutritionService.searchFoodItems(this.gymId(user), search);
  }

  @Post('food-items')
  @HttpCode(HttpStatus.CREATED)
  createFoodItem(@CurrentUser() user: JwtPayload, @Body() dto: CreateFoodItemDto) {
    return this.nutritionService.createFoodItem(this.gymId(user), dto);
  }

  // ─── DIARIO ───────────────────────────────────────────────────────────────────

  @Get('members/:memberId/food-diary')
  getDiary(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Query('date') date: string,
  ) {
    const d = date ?? new Date().toISOString().split('T')[0];
    return this.nutritionService.getDiary(this.gymId(user), memberId, d);
  }

  @Post('members/:memberId/food-diary')
  @HttpCode(HttpStatus.CREATED)
  logFood(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: LogFoodDto,
  ) {
    return this.nutritionService.logFood(this.gymId(user), memberId, dto);
  }

  @Delete('food-diary/:entryId')
  deleteDiaryEntry(
    @CurrentUser() user: JwtPayload,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.nutritionService.deleteDiaryEntry(this.gymId(user), entryId);
  }

  // ─── IA ───────────────────────────────────────────────────────────────────────

  @Post('nutrition/ai-suggest')
  aiSuggest(@CurrentUser() user: JwtPayload, @Body() dto: AiSuggestDto) {
    return this.nutritionService.aiSuggest(
      this.gymId(user),
      dto.plan_id,
      dto.member_id,
      dto.context,
    );
  }
}
