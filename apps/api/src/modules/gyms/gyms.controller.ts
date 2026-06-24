import { Controller, Get, Patch, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { GymsService } from './gyms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('gym')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // GET /api/v1/gym/profile
  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.gymsService.getProfile(this.gymId(user));
  }

  // PATCH /api/v1/gym/profile
  @Patch('profile')
  updateProfile(
    @Body()
    body: {
      name?: string;
      description?: string;
      city?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      timezone?: string;
      currency?: string;
      country?: string;
      logoUrl?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gymsService.updateProfile(this.gymId(user), body);
  }

  // PATCH /api/v1/gym/fiscal
  @Patch('fiscal')
  updateFiscal(
    @Body() body: { taxId?: string; legalName?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gymsService.updateFiscal(this.gymId(user), body);
  }

  // GET /api/v1/gym/operating-hours
  @Get('operating-hours')
  getHours(@CurrentUser() user: JwtPayload) {
    return this.gymsService.getOperatingHours(this.gymId(user));
  }

  // PATCH /api/v1/gym/operating-hours
  @Patch('operating-hours')
  updateHours(
    @Body() body: Record<string, { open: string; close: string; closed: boolean }>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gymsService.updateOperatingHours(this.gymId(user), body);
  }

  // GET /api/v1/gym/social-links
  @Get('social-links')
  getSocial(@CurrentUser() user: JwtPayload) {
    return this.gymsService.getSocialLinks(this.gymId(user));
  }

  // PATCH /api/v1/gym/social-links
  @Patch('social-links')
  updateSocial(
    @Body()
    body: {
      instagram?: string;
      facebook?: string;
      whatsapp?: string;
      tiktok?: string;
      twitter?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gymsService.updateSocialLinks(this.gymId(user), body);
  }

  // GET /api/v1/gym/plan
  @Get('plan')
  getPlan(@CurrentUser() user: JwtPayload) {
    return this.gymsService.getPlanInfo(this.gymId(user));
  }

  // GET /api/v1/gym/stats
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.gymsService.getStats(this.gymId(user));
  }
}
