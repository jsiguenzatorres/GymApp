import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@gymapp/shared-types';
import { PrismaService } from '../database/prisma.service';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

const COUPON_STAFF_ROLES = [UserRole.GYM_OWNER, UserRole.GYM_ADMIN, UserRole.SUPER_ADMIN];

@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly prisma: PrismaService,
  ) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  @UseGuards(RolesGuard)
  @Roles(...COUPON_STAFF_ROLES)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(this.gymId(user), dto);
  }

  @UseGuards(RolesGuard)
  @Roles(...COUPON_STAFF_ROLES)
  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.couponsService.list(this.gymId(user));
  }

  @UseGuards(RolesGuard)
  @Roles(...COUPON_STAFF_ROLES)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(this.gymId(user), id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(...COUPON_STAFF_ROLES)
  @Patch(':id/toggle')
  toggle(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.toggle(this.gymId(user), id);
  }

  // Disponible para cualquier usuario autenticado (staff armando el checkout,
  // o el propio miembro validando un código antes de confirmar su compra).
  @Post('validate')
  async validate(@CurrentUser() user: JwtPayload, @Body() dto: ValidateCouponDto) {
    const gymId = this.gymId(user);
    let memberId = dto.memberId;
    if (!memberId) {
      const m = await this.prisma.member.findFirst({
        where: { user_id: user.sub },
        select: { id: true },
      });
      memberId = m?.id;
    }
    if (!memberId) throw new ForbiddenException('No se pudo resolver el miembro');

    const type = await this.prisma.membershipType.findFirst({
      where: { id: dto.membershipTypeId, gym_id: gymId },
    });
    if (!type) throw new ForbiddenException('Tipo de membresía no válido');

    const { coupon, discountAmount } = await this.couponsService.validate(
      gymId,
      dto.code,
      dto.membershipTypeId,
      memberId,
      Number(type.price),
    );

    return {
      valid: true,
      coupon: { id: coupon.id, code: coupon.code, name: coupon.name },
      discount_amount: discountAmount,
      final_price: Math.max(0, Number(type.price) - discountAmount),
    };
  }
}
