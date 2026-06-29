import {
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
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

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
