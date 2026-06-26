import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import {
  CreateProductDto,
  CreateCategoryDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/create-product.dto';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'READY', 'DELIVERED', 'CANCELLED'];

export interface PhotoIdentifyResult {
  identified: {
    productName?: string;
    brand?: string | null;
    category?: string;
    searchTerms?: string[];
  } | null;
  matches: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    confidence: number;
  }[];
}

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  // ─── CATEGORIES ───────────────────────────────────────────────────────────────

  async listCategories(gymId: string) {
    return this.prisma.productCategory.findMany({
      where: { gym_id: gymId },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(gymId: string, dto: CreateCategoryDto) {
    return this.prisma.productCategory.create({
      data: { gym_id: gymId, ...dto },
    });
  }

  async updateCategory(gymId: string, id: string, dto: Partial<CreateCategoryDto>) {
    await this.findCategory(gymId, id);
    return this.prisma.productCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(gymId: string, id: string) {
    await this.findCategory(gymId, id);
    const count = await this.prisma.product.count({ where: { category_id: id } });
    if (count > 0) throw new BadRequestException('La categoría tiene productos asignados');
    return this.prisma.productCategory.delete({ where: { id } });
  }

  private async findCategory(gymId: string, id: string) {
    const cat = await this.prisma.productCategory.findFirst({ where: { id, gym_id: gymId } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────────

  async listProducts(gymId: string, search?: string, categoryId?: string, onlyActive?: boolean) {
    return this.prisma.product.findMany({
      where: {
        gym_id: gymId,
        ...(onlyActive ? { is_active: true } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    });
  }

  async getProduct(gymId: string, id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, gym_id: gymId },
      include: { category: true },
    });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  async createProduct(gymId: string, dto: CreateProductDto) {
    if (dto.category_id) await this.findCategory(gymId, dto.category_id);
    return this.prisma.product.create({
      data: { gym_id: gymId, ...dto },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updateProduct(gymId: string, id: string, dto: Partial<CreateProductDto>) {
    await this.getProduct(gymId, id);
    if (dto.category_id) await this.findCategory(gymId, dto.category_id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async deleteProduct(gymId: string, id: string) {
    await this.getProduct(gymId, id);
    return this.prisma.product.delete({ where: { id } });
  }

  async adjustStock(gymId: string, id: string, delta: number) {
    const p = await this.getProduct(gymId, id);
    const newStock = p.stock + delta;
    if (newStock < 0) throw new BadRequestException('Stock insuficiente');
    return this.prisma.product.update({ where: { id }, data: { stock: newStock } });
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────────

  async listOrders(gymId: string, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { gym_id: gymId, ...(status ? { status } : {}) };
    const [data, total] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          member: { select: { id: true, first_name: true, last_name: true } },
          items: { include: { product: { select: { id: true, name: true, image_url: true } } } },
        },
      }),
      this.prisma.marketplaceOrder.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrder(gymId: string, id: string) {
    const o = await this.prisma.marketplaceOrder.findFirst({
      where: { id, gym_id: gymId },
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, image_url: true } },
          },
        },
      },
    });
    if (!o) throw new NotFoundException('Pedido no encontrado');
    return o;
  }

  async createOrder(gymId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, gym_id: gymId, is_active: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no encontrados o inactivos');
    }

    const items: { product_id: string; quantity: number; unit_price: number; subtotal: number }[] =
      [];
    let total = 0;

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new BadRequestException(`Producto no encontrado: ${item.product_id}`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock insuficiente para: ${product.name}`);
      }
      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;
      items.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const o = await tx.marketplaceOrder.create({
        data: {
          gym_id: gymId,
          member_id: dto.member_id,
          total,
          notes: dto.notes,
          items: { create: items },
        },
        include: {
          member: { select: { id: true, first_name: true, last_name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return o;
    });

    return order;
  }

  async updateOrderStatus(gymId: string, id: string, dto: UpdateOrderStatusDto) {
    if (!ORDER_STATUSES.includes(dto.status)) {
      throw new BadRequestException(`Estado inválido. Válidos: ${ORDER_STATUSES.join(', ')}`);
    }
    await this.getOrder(gymId, id);
    return this.prisma.marketplaceOrder.update({ where: { id }, data: { status: dto.status } });
  }

  // ── FOTO-COMPRA (Gemini Vision — 200× más barato que Google Vision + GPT-4o) ──

  async identifyByPhoto(
    gymId: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<PhotoIdentifyResult> {
    const prompt = `Analiza esta imagen de un producto de gimnasio, nutrición o suplemento.
Responde SOLO con JSON válido, sin texto adicional, sin markdown:
{
  "productName": "nombre del producto en español",
  "brand": "marca visible en el empaque o null si no se ve",
  "category": "proteína|creatina|pre-entreno|ropa|equipo|accesorio|suplemento|otro",
  "searchTerms": ["término de búsqueda 1", "término 2", "término 3"]
}`;

    let productInfo: PhotoIdentifyResult['identified'] = null;
    try {
      const raw = await this.gemini.generateWithImage(imageBase64, mimeType, prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) productInfo = JSON.parse(jsonMatch[0]) as PhotoIdentifyResult['identified'];
    } catch {
      return { identified: null, matches: [] };
    }

    if (!productInfo?.productName) return { identified: productInfo, matches: [] };

    // pg_trgm similarity search on the gym's product catalog
    const searchTerm = [productInfo.productName, productInfo.brand].filter(Boolean).join(' ');

    const matches = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        price: number;
        image_url: string | null;
        similarity: number;
      }[]
    >`
      SELECT
        p.id,
        p.name,
        p.price::float AS price,
        p.image_url,
        similarity(
          lower(p.name || ' ' || COALESCE(p.description, '')),
          lower(${searchTerm})
        ) AS similarity
      FROM products p
      WHERE p.gym_id = ${gymId}::uuid
        AND p.is_active = true
        AND p.stock_qty > 0
        AND similarity(
          lower(p.name || ' ' || COALESCE(p.description, '')),
          lower(${searchTerm})
        ) > 0.08
      ORDER BY similarity DESC
      LIMIT 5
    `;

    return {
      identified: productInfo,
      matches: matches.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        imageUrl: m.image_url,
        confidence: Math.round(m.similarity * 100),
      })),
    };
  }

  async getMarketplaceStats(gymId: string) {
    const [totalProducts, activeProducts, totalOrders, pendingOrders, revenue] = await Promise.all([
      this.prisma.product.count({ where: { gym_id: gymId } }),
      this.prisma.product.count({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.marketplaceOrder.count({ where: { gym_id: gymId } }),
      this.prisma.marketplaceOrder.count({
        where: { gym_id: gymId, status: { in: ['PENDING', 'CONFIRMED', 'READY'] } },
      }),
      this.prisma.marketplaceOrder.aggregate({
        where: { gym_id: gymId, status: { in: ['DELIVERED', 'CONFIRMED', 'READY'] } },
        _sum: { total: true },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      revenue: Number(revenue._sum.total ?? 0),
    };
  }
}
