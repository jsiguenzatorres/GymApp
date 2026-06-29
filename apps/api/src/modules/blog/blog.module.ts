import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(gymId: string, category?: string) {
    return this.prisma.blogPost.findMany({
      where: { gym_id: gymId, is_published: true, ...(category ? { category } : {}) },
      orderBy: { published_at: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        cover_url: true,
        author_name: true,
        category: true,
        tags: true,
        published_at: true,
        views_count: true,
      },
    });
  }

  async getBySlug(gymId: string, slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { gym_id: gymId, slug, is_published: true },
    });
    if (!post) throw new NotFoundException('Post no encontrado');
    // Fire-and-forget view count
    this.prisma.blogPost
      .update({ where: { id: post.id }, data: { views_count: { increment: 1 } } })
      .catch(() => null);
    return post;
  }

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  async listAdmin(gymId: string) {
    return this.prisma.blogPost.findMany({
      where: { gym_id: gymId },
      orderBy: [{ is_published: 'desc' }, { created_at: 'desc' }],
    });
  }

  async getAdmin(gymId: string, id: string) {
    const post = await this.prisma.blogPost.findFirst({ where: { id, gym_id: gymId } });
    if (!post) throw new NotFoundException('Post no encontrado');
    return post;
  }

  async createAdmin(
    gymId: string,
    dto: {
      title: string;
      slug?: string;
      excerpt?: string;
      content_md: string;
      cover_url?: string;
      author_name?: string;
      category?: string;
      tags?: string[];
      is_published?: boolean;
    },
  ) {
    const slug = (dto.slug ?? this.slugify(dto.title)).toLowerCase();
    return this.prisma.blogPost.create({
      data: {
        gym_id: gymId,
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content_md: dto.content_md,
        cover_url: dto.cover_url,
        author_name: dto.author_name,
        category: dto.category,
        tags: dto.tags ?? [],
        is_published: dto.is_published ?? false,
        published_at: dto.is_published ? new Date() : null,
      },
    });
  }

  async updateAdmin(
    gymId: string,
    id: string,
    dto: Partial<{
      title: string;
      slug: string;
      excerpt: string;
      content_md: string;
      cover_url: string;
      author_name: string;
      category: string;
      tags: string[];
      is_published: boolean;
    }>,
  ) {
    const existing = await this.getAdmin(gymId, id);
    const wasPublished = existing.is_published;
    const willPublish = dto.is_published === true && !wasPublished;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...dto,
        ...(willPublish ? { published_at: new Date() } : {}),
      },
    });
  }

  async deleteAdmin(gymId: string, id: string) {
    await this.getAdmin(gymId, id);
    return this.prisma.blogPost.delete({ where: { id } });
  }

  private slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }
}

@Controller('me/blog')
@UseGuards(JwtAuthGuard)
class BlogController {
  constructor(
    private readonly svc: BlogService,
    private readonly prisma: PrismaService,
  ) {}

  private async gymIdOf(user: JwtPayload): Promise<string> {
    if (user.gymId) return user.gymId;
    const member = await this.prisma.member.findFirst({
      where: { user_id: user.sub },
      select: { gym_id: true },
    });
    if (!member) throw new ForbiddenException('No gym context');
    return member.gym_id;
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('category') category?: string) {
    return this.svc.list(await this.gymIdOf(user), category);
  }

  @Get(':slug')
  async getBySlug(@CurrentUser() user: JwtPayload, @Param('slug') slug: string) {
    return this.svc.getBySlug(await this.gymIdOf(user), slug);
  }
}

@Controller('admin/blog')
@UseGuards(JwtAuthGuard)
class BlogAdminController {
  constructor(private readonly svc: BlogService) {}

  private requireStaff(user: JwtPayload) {
    if (!['GYM_OWNER', 'GYM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Solo staff puede gestionar el blog');
    }
  }

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('gymId requerido');
    return user.gymId;
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    this.requireStaff(user);
    return this.svc.listAdmin(this.gymId(user));
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    this.requireStaff(user);
    return this.svc.getAdmin(this.gymId(user), id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      title: string;
      slug?: string;
      excerpt?: string;
      content_md: string;
      cover_url?: string;
      author_name?: string;
      category?: string;
      tags?: string[];
      is_published?: boolean;
    },
  ) {
    this.requireStaff(user);
    return this.svc.createAdmin(this.gymId(user), body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      slug: string;
      excerpt: string;
      content_md: string;
      cover_url: string;
      author_name: string;
      category: string;
      tags: string[];
      is_published: boolean;
    }>,
  ) {
    this.requireStaff(user);
    return this.svc.updateAdmin(this.gymId(user), id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    this.requireStaff(user);
    return this.svc.deleteAdmin(this.gymId(user), id);
  }
}

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [BlogService],
  controllers: [BlogController, BlogAdminController],
})
export class BlogModule {}
