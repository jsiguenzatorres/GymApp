import { Body, Controller, ForbiddenException, Get, Module, Post, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(memberId: string) {
    return this.prisma.memberOnboarding.upsert({
      where: { member_id: memberId },
      create: { member_id: memberId },
      update: {},
    });
  }

  async submitParq(memberId: string, dto: { answers: Record<string, boolean> }) {
    const hasConditions = Object.values(dto.answers).some((v) => v === true);
    const now = new Date();
    return this.maybeFinalize(
      memberId,
      this.prisma.memberOnboarding.upsert({
        where: { member_id: memberId },
        create: {
          member_id: memberId,
          parq_completed: true,
          parq_has_conditions: hasConditions,
          parq_answers: dto.answers as never,
          parq_completed_at: now,
        },
        update: {
          parq_completed: true,
          parq_has_conditions: hasConditions,
          parq_answers: dto.answers as never,
          parq_completed_at: now,
        },
      }),
    );
  }

  async submitGoal(
    memberId: string,
    dto: {
      goal_type: string;
      goal_target_value?: number;
      goal_target_unit?: string;
      goal_deadline?: string;
    },
  ) {
    const now = new Date();
    return this.maybeFinalize(
      memberId,
      this.prisma.memberOnboarding.upsert({
        where: { member_id: memberId },
        create: {
          member_id: memberId,
          goal_type: dto.goal_type,
          goal_target_value: dto.goal_target_value,
          goal_target_unit: dto.goal_target_unit,
          goal_deadline: dto.goal_deadline ? new Date(dto.goal_deadline) : undefined,
          goal_completed_at: now,
        },
        update: {
          goal_type: dto.goal_type,
          goal_target_value: dto.goal_target_value,
          goal_target_unit: dto.goal_target_unit,
          goal_deadline: dto.goal_deadline ? new Date(dto.goal_deadline) : undefined,
          goal_completed_at: now,
        },
      }),
    );
  }

  async markPhotoUploaded(memberId: string) {
    const now = new Date();
    return this.maybeFinalize(
      memberId,
      this.prisma.memberOnboarding.upsert({
        where: { member_id: memberId },
        create: { member_id: memberId, initial_photo_uploaded: true, initial_photo_at: now },
        update: { initial_photo_uploaded: true, initial_photo_at: now },
      }),
    );
  }

  async acceptContract(memberId: string, version = '1.0') {
    const now = new Date();
    return this.maybeFinalize(
      memberId,
      this.prisma.memberOnboarding.upsert({
        where: { member_id: memberId },
        create: {
          member_id: memberId,
          contract_accepted: true,
          contract_accepted_at: now,
          contract_version: version,
        },
        update: {
          contract_accepted: true,
          contract_accepted_at: now,
          contract_version: version,
        },
      }),
    );
  }

  // Si los 4 pasos están listos, marca completed_at
  private async maybeFinalize<T extends Promise<unknown>>(memberId: string, promise: T) {
    await promise;
    const ob = await this.prisma.memberOnboarding.findUnique({ where: { member_id: memberId } });
    if (!ob) return ob;
    const allDone =
      ob.parq_completed &&
      ob.goal_completed_at &&
      ob.initial_photo_uploaded &&
      ob.contract_accepted;
    if (allDone && !ob.completed_at) {
      return this.prisma.memberOnboarding.update({
        where: { member_id: memberId },
        data: { completed_at: new Date() },
      });
    }
    return ob;
  }
}

@Controller('me/onboarding')
@UseGuards(JwtAuthGuard)
class OnboardingController {
  constructor(
    private readonly svc: OnboardingService,
    private readonly prisma: PrismaService,
  ) {}

  private async memberId(user: JwtPayload) {
    const m = await this.prisma.member.findFirst({
      where: { user_id: user.sub },
      select: { id: true },
    });
    if (!m) throw new ForbiddenException('Member no encontrado');
    return m.id;
  }

  @Get()
  async get(@CurrentUser() user: JwtPayload) {
    return this.svc.getOrCreate(await this.memberId(user));
  }

  @Post('parq')
  async parq(@CurrentUser() user: JwtPayload, @Body() body: { answers: Record<string, boolean> }) {
    return this.svc.submitParq(await this.memberId(user), body);
  }

  @Post('goal')
  async goal(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      goal_type: string;
      goal_target_value?: number;
      goal_target_unit?: string;
      goal_deadline?: string;
    },
  ) {
    return this.svc.submitGoal(await this.memberId(user), body);
  }

  @Post('photo')
  async photo(@CurrentUser() user: JwtPayload) {
    return this.svc.markPhotoUploaded(await this.memberId(user));
  }

  @Post('contract')
  async contract(@CurrentUser() user: JwtPayload, @Body() body: { version?: string }) {
    return this.svc.acceptContract(await this.memberId(user), body.version);
  }
}

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [OnboardingService],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
