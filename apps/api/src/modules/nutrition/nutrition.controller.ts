import {
  Controller,
  Get,
  Post,
  Put,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@gymapp/shared-types';
import { NutritionService } from './nutrition.service';
import {
  CreatePlanDto,
  CreateFoodItemDto,
  UpdateFoodItemDto,
  LogFoodDto,
  AiSuggestDto,
  UpsertNutritionProfileDto,
  CalculateTmbTdeeDto,
  ReviewRiskAlertDto,
  UploadLabResultDto,
  ReviewLabResultDto,
} from './dto/nutrition.dto';

const NUTRITION_STAFF_ROLES = [UserRole.GYM_OWNER, UserRole.GYM_ADMIN, UserRole.NUTRITIONIST];

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

  @Get('nutrition-plans/:id/history')
  listPlanHistory(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.nutritionService.listPlanHistory(this.gymId(user), id);
  }

  // ─── PERFIL NUTRICIONAL (D-25) ──────────────────────────────────────────────

  @Get('members/:memberId/nutrition-profile')
  getNutritionProfile(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.nutritionService.getNutritionProfile(this.gymId(user), memberId);
  }

  @Put('members/:memberId/nutrition-profile')
  upsertNutritionProfile(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpsertNutritionProfileDto,
  ) {
    return this.nutritionService.upsertNutritionProfile(this.gymId(user), memberId, dto);
  }

  // ─── MOTOR TMB/TDEE (D-26) ──────────────────────────────────────────────────

  @Post('nutrition/calculate-tmb-tdee')
  calculateTmbTdee(@CurrentUser() user: JwtPayload, @Body() dto: CalculateTmbTdeeDto) {
    return this.nutritionService.calculateTmbTdee(this.gymId(user), dto.memberId, dto.goal);
  }

  // ─── ALERTAS DE RIESGO TCA (D-23) ───────────────────────────────────────────

  @Get('nutrition/risk-alerts')
  listRiskAlerts(@CurrentUser() user: JwtPayload) {
    return this.nutritionService.listRiskAlerts(this.gymId(user));
  }

  @Patch('nutrition/risk-alerts/:id/review')
  reviewRiskAlert(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewRiskAlertDto,
  ) {
    return this.nutritionService.reviewRiskAlert(this.gymId(user), id, dto);
  }

  // ─── FICHA DEL MIEMBRO — staff-only ─────────────────────────────────────────
  // Para que el nutricionista evalúe progreso, adherencia y registro de
  // alimentación de un miembro antes/durante una cita.
  @UseGuards(RolesGuard)
  @Roles(...NUTRITION_STAFF_ROLES)
  @Get('nutrition/members/:memberId/overview')
  getMemberOverview(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.nutritionService.getMemberOverview(this.gymId(user), memberId);
  }

  // ─── ANÁLISIS DE LABORATORIO (D-29) — staff-only ────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(...NUTRITION_STAFF_ROLES)
  @Post('nutrition/lab-results')
  @HttpCode(HttpStatus.CREATED)
  uploadLabResult(@CurrentUser() user: JwtPayload, @Body() dto: UploadLabResultDto) {
    return this.nutritionService.uploadLabResult(this.gymId(user), user.staffId ?? user.sub, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(...NUTRITION_STAFF_ROLES)
  @Get('members/:memberId/lab-results')
  listLabResults(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.nutritionService.listLabResults(this.gymId(user), memberId);
  }

  @UseGuards(RolesGuard)
  @Roles(...NUTRITION_STAFF_ROLES)
  @Get('lab-results/:id')
  getLabResult(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.nutritionService.getLabResult(this.gymId(user), id);
  }

  @UseGuards(RolesGuard)
  @Roles(...NUTRITION_STAFF_ROLES)
  @Patch('lab-results/:id/review')
  reviewLabResult(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLabResultDto,
  ) {
    return this.nutritionService.reviewLabResult(
      this.gymId(user),
      id,
      user.staffId ?? user.sub,
      dto,
    );
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

  @Patch('food-items/:id')
  updateFoodItem(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodItemDto,
  ) {
    return this.nutritionService.updateFoodItem(this.gymId(user), id, dto);
  }

  @Delete('food-items/:id')
  deleteFoodItem(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.nutritionService.deleteFoodItem(this.gymId(user), id);
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

  // GET /members/:memberId/nutrition/today-macros — nutrient timing (D-27):
  // ajusta carbos/grasas de HOY según si el miembro ya entrenó hoy.
  @Get('members/:memberId/nutrition/today-macros')
  getTodayAdjustedMacros(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.nutritionService.getTodayAdjustedMacros(this.gymId(user), memberId);
  }

  @Get('members/:memberId/food-diary/range')
  getDiaryRange(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Query('days') days?: string,
  ) {
    return this.nutritionService.getDiaryRange(
      this.gymId(user),
      memberId,
      days ? parseInt(days) : 30,
    );
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

  // POST /nutrition/copilot-chat — co-piloto conversacional del nutricionista (D-37)
  // Body: { memberId, message, history?: [{role, parts:[{text}]}] }
  @Post('nutrition/copilot-chat')
  copilotChat(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      memberId: string;
      message: string;
      history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
    },
  ) {
    return this.nutritionService.copilotChat(
      this.gymId(user),
      body.memberId,
      body.message,
      body.history ?? [],
    );
  }

  @Post('nutrition/ai-suggest')
  aiSuggest(@CurrentUser() user: JwtPayload, @Body() dto: AiSuggestDto) {
    return this.nutritionService.aiSuggest(
      this.gymId(user),
      dto.plan_id,
      dto.member_id,
      dto.context,
    );
  }

  // POST /nutrition/photo-analyze — ELITE: foto del plato → identificación IA
  // Body: { image: "data:image/jpeg;base64,..." }
  @Post('nutrition/photo-analyze')
  analyzePhoto(@Body() body: { image: string }) {
    return this.nutritionService.analyzeMealPhoto(body.image);
  }

  // POST /nutrition/recipes/generate — ELITE: generador de recetas IA
  // Body: { ingredients: ["pollo","arroz"], preferences?: "sin lactosa" }
  @Post('nutrition/recipes/generate')
  generateRecipe(@Body() body: { ingredients: string[]; preferences?: string }) {
    return this.nutritionService.generateRecipe(body.ingredients, body.preferences);
  }

  // POST /nutrition/shopping-list/generate — PRO+: lista de compras semanal
  // Body: { memberId: string }
  @Post('nutrition/shopping-list/generate')
  generateShoppingList(@CurrentUser() user: JwtPayload, @Body() body: { memberId: string }) {
    return this.nutritionService.generateShoppingList(this.gymId(user), body.memberId);
  }

  // GET /food-items/by-barcode/:code — lookup local + OpenFoodFacts cache
  @Get('food-items/by-barcode/:code')
  findByBarcode(@CurrentUser() user: JwtPayload, @Param('code') code: string) {
    return this.nutritionService.findByBarcode(this.gymId(user), code);
  }

  // POST /nutrition/log-from-text — parser NL ("comí 200g pollo") + registro
  // Body: { memberId: string, text: string }
  @Post('nutrition/log-from-text')
  logFromText(@CurrentUser() user: JwtPayload, @Body() body: { memberId: string; text: string }) {
    return this.nutritionService.logFromText(this.gymId(user), body.memberId, body.text);
  }

  // POST /nutrition/adaptive-analysis — ELITE: IA analiza progreso y sugiere ajustes
  @Post('nutrition/adaptive-analysis')
  adaptiveAnalysis(@CurrentUser() user: JwtPayload, @Body() body: { memberId: string }) {
    return this.nutritionService.adaptivePlanAnalysis(this.gymId(user), body.memberId);
  }

  // POST /nutrition/adaptive-apply — aplica ajustes sugeridos al plan activo
  @Post('nutrition/adaptive-apply')
  adaptiveApply(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { memberId: string; target_kcal_delta?: number; target_protein_g_delta?: number },
  ) {
    return this.nutritionService.applyAdaptiveAdjustment(this.gymId(user), body.memberId, {
      target_kcal_delta: body.target_kcal_delta,
      target_protein_g_delta: body.target_protein_g_delta,
    });
  }
}
