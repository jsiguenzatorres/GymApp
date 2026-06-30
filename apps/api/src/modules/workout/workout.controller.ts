import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { WorkoutService } from './workout.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { LogSetDto, FinishSessionDto } from './dto/log-set.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // ─── EJERCICIOS ───────────────────────────────────────────────────────────────

  @Get('exercises')
  listExercises(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('muscleGroup') muscleGroup?: string,
    @Query('equipment') equipment?: string,
    @Query('category') category?: string,
  ) {
    return this.workoutService.listExercises(this.gymId(user), {
      search,
      muscleGroup,
      equipment,
      category,
    });
  }

  @Get('exercises/:id')
  getExercise(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutService.getExercise(this.gymId(user), id);
  }

  // GET /exercises/:id/history — últimas N sesiones del miembro autenticado con ese ejercicio
  @Get('exercises/:id/history')
  getExerciseHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutService.getMyExerciseHistory(
      this.gymId(user),
      user.sub,
      id,
      limit ? parseInt(limit) : 5,
    );
  }

  // GET /exercises/:id/suggestion — peso sugerido próximo set
  @Get('exercises/:id/suggestion')
  getExerciseSuggestion(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutService.getWeightSuggestion(this.gymId(user), user.sub, id);
  }

  // GET /exercises/:id/substitutes — ejercicios alternativos (similar grupo muscular + equipo)
  @Get('exercises/:id/substitutes')
  getExerciseSubstitutes(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutService.getSubstitutes(this.gymId(user), id, limit ? parseInt(limit) : 8);
  }

  @Post('exercises')
  @HttpCode(HttpStatus.CREATED)
  createExercise(@CurrentUser() user: JwtPayload, @Body() dto: CreateExerciseDto) {
    return this.workoutService.createExercise(this.gymId(user), dto);
  }

  @Patch('exercises/:id')
  updateExercise(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateExerciseDto>,
  ) {
    return this.workoutService.updateExercise(this.gymId(user), id, dto);
  }

  // ─── PLANES ───────────────────────────────────────────────────────────────────

  @Get('workout-plans')
  listPlans(@CurrentUser() user: JwtPayload) {
    return this.workoutService.listPlans(this.gymId(user));
  }

  @Post('workout-plans')
  @HttpCode(HttpStatus.CREATED)
  createPlan(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlanDto) {
    return this.workoutService.createPlan(this.gymId(user), dto);
  }

  @Get('workout-plans/:id')
  getPlan(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutService.getPlan(this.gymId(user), id);
  }

  @Patch('workout-plans/:id')
  updatePlan(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePlanDto,
  ) {
    return this.workoutService.updatePlan(this.gymId(user), id, dto);
  }

  @Delete('workout-plans/:id')
  @HttpCode(HttpStatus.OK)
  deletePlan(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutService.deletePlan(this.gymId(user), id);
  }

  @Post('members/:memberId/plans')
  @HttpCode(HttpStatus.CREATED)
  assignPlan(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body('planId') planId: string,
    @Body('notes') notes?: string,
  ) {
    return this.workoutService.assignPlanToMember(this.gymId(user), memberId, planId, notes);
  }

  @Get('members/:memberId/plans')
  getMemberPlans(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.workoutService.getMemberPlans(this.gymId(user), memberId);
  }

  // ─── SESIONES ─────────────────────────────────────────────────────────────────

  @Post('workout-sessions')
  @HttpCode(HttpStatus.CREATED)
  startSession(@CurrentUser() user: JwtPayload, @Body() dto: StartSessionDto) {
    return this.workoutService.startSession(this.gymId(user), dto);
  }

  @Get('workout-sessions/:id')
  getSession(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutService.getSession(this.gymId(user), id);
  }

  @Post('workout-sessions/:id/sets')
  @HttpCode(HttpStatus.CREATED)
  logSet(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: LogSetDto,
  ) {
    return this.workoutService.logSet(this.gymId(user), sessionId, dto);
  }

  @Patch('workout-sessions/:id/finish')
  finishSession(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: FinishSessionDto,
  ) {
    return this.workoutService.finishSession(this.gymId(user), sessionId, dto);
  }

  @Get('members/:memberId/workout-sessions')
  getMemberSessions(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutService.getMemberSessions(
      this.gymId(user),
      memberId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('members/:memberId/personal-records')
  getMemberPRs(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.workoutService.getMemberPRs(this.gymId(user), memberId);
  }

  // ─── STATS ────────────────────────────────────────────────────────────────────

  @Get('workout/stats')
  getWorkoutStats(@CurrentUser() user: JwtPayload) {
    return this.workoutService.getWorkoutStats(this.gymId(user));
  }

  // ─── ZEUS ─────────────────────────────────────────────────────────────────────

  @Post('workout/zeus/chat')
  zeusChat(@CurrentUser() user: JwtPayload, @Body() body: { message: string; memberId?: string }) {
    const memberId = body.memberId ?? user.sub;
    return this.workoutService.zeusChat(this.gymId(user), memberId, body.message);
  }
}
