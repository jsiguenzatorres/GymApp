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
import { MarketplaceService } from './marketplace.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateProductDto,
  CreateCategoryDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/create-product.dto';
import { STAFF_ROLES } from '@gymapp/shared-types';

@RequiresPlan('PRO', 'ELITE', 'ENTERPRISE')
@UseGuards(JwtAuthGuard, PlanGuard)
@Controller()
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly storageService: StorageService,
  ) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // ─── STATS ────────────────────────────────────────────────────────────────────

  @Get('marketplace/stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.marketplaceService.getMarketplaceStats(this.gymId(user));
  }

  // ─── CATEGORIES ───────────────────────────────────────────────────────────────

  @Get('product-categories')
  listCategories(@CurrentUser() user: JwtPayload) {
    return this.marketplaceService.listCategories(this.gymId(user));
  }

  @Post('product-categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.marketplaceService.createCategory(this.gymId(user), dto);
  }

  @Patch('product-categories/:id')
  updateCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.marketplaceService.updateCategory(this.gymId(user), id, dto);
  }

  @Delete('product-categories/:id')
  deleteCategory(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.deleteCategory(this.gymId(user), id);
  }

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────────

  @Get('products')
  listProducts(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.marketplaceService.listProducts(
      this.gymId(user),
      search,
      categoryId,
      onlyActive === 'true',
    );
  }

  @Get('products/:id')
  getProduct(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.getProduct(this.gymId(user), id);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.marketplaceService.createProduct(this.gymId(user), dto);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.marketplaceService.updateProduct(this.gymId(user), id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.deleteProduct(this.gymId(user), id);
  }

  // POST /products/upload-image — sube imagen a Supabase Storage y retorna URL pública.
  // Body: { image: "data:image/png;base64,..." }
  @Post('products/upload-image')
  @HttpCode(HttpStatus.CREATED)
  async uploadProductImage(@CurrentUser() user: JwtPayload, @Body('image') imageDataUri: string) {
    const result = await this.storageService.uploadProductImage(this.gymId(user), imageDataUri);
    return { url: result.url };
  }

  @Patch('products/:id/stock')
  adjustStock(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('delta') delta: number,
  ) {
    return this.marketplaceService.adjustStock(this.gymId(user), id, delta);
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────────

  @Get('marketplace-orders')
  listOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.listOrders(
      this.gymId(user),
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('marketplace-orders/:id')
  getOrder(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.getOrder(this.gymId(user), id);
  }

  @Post('marketplace-orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    const gymId = this.gymId(user);
    const isStaff = (STAFF_ROLES as readonly string[]).includes(user.role);
    if (!isStaff) {
      const own = await this.marketplaceService.isOwnMember(gymId, user.sub, dto.member_id);
      if (!own) throw new ForbiddenException('No puedes crear pedidos para otro miembro');
    }
    return this.marketplaceService.createOrder(gymId, dto);
  }

  @Patch('marketplace-orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.marketplaceService.updateOrderStatus(this.gymId(user), id, dto);
  }

  // ── FOTO-COMPRA: identifica producto por imagen (Gemini Flash Vision) ─────────
  @Post('products/by-photo')
  identifyByPhoto(
    @CurrentUser() user: JwtPayload,
    @Body('image') imageBase64: string,
    @Body('mimeType') mimeType: string,
  ) {
    return this.marketplaceService.identifyByPhoto(
      this.gymId(user),
      imageBase64,
      mimeType ?? 'image/jpeg',
    );
  }
}
