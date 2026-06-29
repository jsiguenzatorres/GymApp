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
import { MembersService } from './members.service';
import { CreateMembershipTypeDto, UpdateMembershipTypeDto } from './dto/create-membership-type.dto';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import {
  AssignMembershipDto,
  FreezeMembershipDto,
  CancelMembershipDto,
} from './dto/membership-actions.dto';
import { ListMembersDto } from './dto/list-members.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // ─── MEMBERSHIP TYPES ────────────────────────────────────────────────────────

  @Get('membership-types')
  listMembershipTypes(@CurrentUser() user: JwtPayload) {
    return this.membersService.listMembershipTypes(this.gymId(user));
  }

  @Post('membership-types')
  createMembershipType(@CurrentUser() user: JwtPayload, @Body() dto: CreateMembershipTypeDto) {
    return this.membersService.createMembershipType(this.gymId(user), dto);
  }

  @Patch('membership-types/:id')
  updateMembershipType(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipTypeDto,
  ) {
    return this.membersService.updateMembershipType(this.gymId(user), id, dto);
  }

  @Delete('membership-types/:id')
  @HttpCode(HttpStatus.OK)
  toggleMembershipType(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.toggleMembershipType(this.gymId(user), id);
  }

  // ─── MEMBERS ─────────────────────────────────────────────────────────────────

  // GET /api/v1/members/me — perfil del miembro autenticado (para app móvil)
  @Get('members/me')
  getMyMemberProfile(@CurrentUser() user: JwtPayload) {
    return this.membersService.findMyProfile(user.sub, this.gymId(user));
  }

  // POST /api/v1/members/me/avatar — subir foto de perfil (base64 data URI)
  // Body: { image: "data:image/jpeg;base64,..." }
  @Post('members/me/avatar')
  uploadMyAvatar(@CurrentUser() user: JwtPayload, @Body() body: { image: string }) {
    return this.membersService.updateMyAvatar(user.sub, this.gymId(user), body.image);
  }

  // GET /api/v1/members/me/stats — agregador para el Home: racha, semana, próximo entreno
  @Get('members/me/stats')
  getMyHomeStats(@CurrentUser() user: JwtPayload) {
    return this.membersService.findMyHomeStats(user.sub, this.gymId(user));
  }

  // GET /api/v1/members/me/volume-weekly — volumen agregado últimas 8 semanas + top ejercicios
  @Get('members/me/volume-weekly')
  getMyVolumeWeekly(@CurrentUser() user: JwtPayload, @Query('weeks') weeks?: string) {
    return this.membersService.getMyVolumeWeekly(
      user.sub,
      this.gymId(user),
      weeks ? parseInt(weeks) : 8,
    );
  }

  // GET /api/v1/members/me/progress-photos — listado de fotos del miembro
  @Get('members/me/progress-photos')
  listMyProgressPhotos(@CurrentUser() user: JwtPayload) {
    return this.membersService.listMyProgressPhotos(user.sub, this.gymId(user));
  }

  // POST /api/v1/members/me/progress-photos — subir foto (base64) + metadata opcional
  @Post('members/me/progress-photos')
  uploadMyProgressPhoto(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      image: string;
      category?: 'FRONT' | 'SIDE' | 'BACK' | 'CUSTOM';
      weight_kg?: number;
      note?: string;
      taken_at?: string;
    },
  ) {
    return this.membersService.uploadMyProgressPhoto(user.sub, this.gymId(user), body);
  }

  // DELETE /api/v1/members/me/progress-photos/:id
  @Delete('members/me/progress-photos/:id')
  deleteMyProgressPhoto(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.deleteMyProgressPhoto(user.sub, this.gymId(user), id);
  }

  @Get('members')
  listMembers(@CurrentUser() user: JwtPayload, @Query() query: ListMembersDto) {
    return this.membersService.listMembers(this.gymId(user), query);
  }

  @Post('members')
  createMember(@CurrentUser() user: JwtPayload, @Body() dto: CreateMemberDto) {
    return this.membersService.createMember(this.gymId(user), dto);
  }

  @Get('members/:id')
  getMember(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.getMember(this.gymId(user), id);
  }

  @Patch('members/:id')
  updateMember(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.updateMember(this.gymId(user), id, dto);
  }

  // ─── MEMBER MEMBERSHIPS ───────────────────────────────────────────────────────

  @Get('members/:memberId/memberships')
  getMemberMemberships(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.membersService.getMemberMemberships(this.gymId(user), memberId);
  }

  @Post('members/:memberId/memberships')
  @HttpCode(HttpStatus.CREATED)
  assignMembership(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: AssignMembershipDto,
  ) {
    return this.membersService.assignMembership(this.gymId(user), memberId, dto);
  }

  @Patch('members/:memberId/memberships/:id/freeze')
  freezeMembership(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FreezeMembershipDto,
  ) {
    return this.membersService.freezeMembership(this.gymId(user), memberId, id, dto);
  }

  @Patch('members/:memberId/memberships/:id/unfreeze')
  unfreezeMembership(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.unfreezeMembership(this.gymId(user), memberId, id);
  }

  @Patch('members/:memberId/memberships/:id/cancel')
  cancelMembership(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelMembershipDto,
  ) {
    return this.membersService.cancelMembership(this.gymId(user), memberId, id, dto);
  }

  // ─── SELF-SERVICE (E3) — el miembro solicita freeze/cancel directo desde la app
  @Post('members/me/membership/request-freeze')
  async requestFreezeMine(
    @CurrentUser() user: JwtPayload,
    @Body() body: { duration_days: number; reason?: string },
  ) {
    return this.membersService.requestFreezeMine(this.gymId(user), user.sub, body);
  }

  @Post('members/me/membership/request-cancel')
  async requestCancelMine(@CurrentUser() user: JwtPayload, @Body() body: { reason: string }) {
    return this.membersService.requestCancelMine(this.gymId(user), user.sub, body.reason);
  }

  @Get('members/me/membership/types-available')
  async typesAvailableMine(@CurrentUser() user: JwtPayload) {
    return this.membersService.listAvailableMembershipTypes(this.gymId(user));
  }

  @Post('members/me/membership/request-change')
  async requestChangeMine(
    @CurrentUser() user: JwtPayload,
    @Body() body: { new_type_id: string; reason?: string },
  ) {
    return this.membersService.requestChangeMine(
      this.gymId(user),
      user.sub,
      body.new_type_id,
      body.reason,
    );
  }
}
