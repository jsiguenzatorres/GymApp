import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import {
  CreateProductDto,
  CreateCategoryDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/create-product.dto';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

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

  async adjustStock(gymId: string, id: string, delta: number, userId: string, reason?: string) {
    const p = await this.getProduct(gymId, id);
    const newStock = p.stock + delta;
    if (newStock < 0) throw new BadRequestException('Stock insuficiente');
    if (delta === 0) throw new BadRequestException('La cantidad debe ser distinta de 0');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data: { stock: newStock } });
      await tx.stockMovement.create({
        data: {
          gym_id: gymId,
          product_id: id,
          type: delta > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(delta),
          balance_after: newStock,
          reason,
          created_by: userId,
        },
      });
      return updated;
    });
  }

  async listStockMovements(gymId: string, productId: string, page = 1, limit = 20) {
    await this.getProduct(gymId, productId);
    const skip = (page - 1) * limit;
    const where = { gym_id: gymId, product_id: productId };
    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const staffIds = [...new Set(items.map((i) => i.created_by).filter(Boolean))] as string[];
    const staffNames = staffIds.length
      ? await this.prisma.staff.findMany({
          where: { user_id: { in: staffIds }, gym_id: gymId },
          select: { user_id: true, first_name: true, last_name: true },
        })
      : [];
    const staffNameByUserId = new Map(
      staffNames.map((s) => [s.user_id, `${s.first_name} ${s.last_name}`]),
    );

    const data = items.map((item) => ({
      ...item,
      created_by_name: item.created_by ? (staffNameByUserId.get(item.created_by) ?? null) : null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────────

  // memberId presente = restringido a "mis pedidos" (llamado por un MEMBER, no staff)
  async listOrders(gymId: string, status?: string, page = 1, limit = 20, memberId?: string) {
    const skip = (page - 1) * limit;
    const where = {
      gym_id: gymId,
      ...(status ? { status } : {}),
      ...(memberId ? { member_id: memberId } : {}),
    };
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

  async getOrder(gymId: string, id: string, memberId?: string) {
    const o = await this.prisma.marketplaceOrder.findFirst({
      where: { id, gym_id: gymId, ...(memberId ? { member_id: memberId } : {}) },
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

  async resolveMemberId(gymId: string, userId: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: { gym_id: gymId, user_id: userId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member.id;
  }

  // Genera el ticket de compra en PDF con los datos reales de la orden — se
  // genera al vuelo (no se guarda archivo) porque una orden ya creada no
  // cambia, así que siempre está en sincronía con la BD sin costo de storage.
  async generateReceiptPdf(gymId: string, orderId: string, memberId?: string): Promise<Buffer> {
    const [order, gym] = await Promise.all([
      this.prisma.marketplaceOrder.findFirst({
        where: { id: orderId, gym_id: gymId, ...(memberId ? { member_id: memberId } : {}) },
        include: {
          member: { include: { user: { select: { email: true } } } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      }),
      this.prisma.gym.findUnique({
        where: { id: gymId },
        select: {
          name: true,
          address: true,
          phone: true,
          tax_id: true,
          legal_name: true,
          logo_url: true,
        },
      }),
    ]);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const attendedBy = order.created_by
      ? await this.prisma.staff.findFirst({
          where: { user_id: order.created_by, gym_id: gymId },
          select: { first_name: true, last_name: true },
        })
      : null;

    // Logo opcional — si falla la descarga o el formato no es soportado por
    // pdfkit (solo PNG/JPEG), se omite sin romper la generación del ticket.
    let logoBuffer: Buffer | null = null;
    if (gym?.logo_url) {
      try {
        const res = await fetch(gym.logo_url);
        const contentType = res.headers.get('content-type') ?? '';
        if (res.ok && /image\/(png|jpe?g)/.test(contentType)) {
          logoBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {
        logoBuffer = null;
      }
    }

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const ticketLabel = order.ticket_number
        ? `N.° ${String(order.ticket_number).padStart(6, '0')}`
        : `#${order.id.slice(0, 8).toUpperCase()}`;
      const issuedAt = order.created_at.toLocaleString('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Encabezado — logo (si se pudo descargar) + datos del gym
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, doc.page.width / 2 - 30, doc.y, { fit: [60, 60], align: 'center' });
          doc.moveDown(4.5);
        } catch {
          // Buffer no era una imagen válida para pdfkit — se omite sin interrumpir el ticket
        }
      }
      doc
        .fontSize(18)
        .fillColor('#1d4ed8')
        .text(gym?.legal_name ?? gym?.name ?? 'GymApp', { align: 'center' });
      const contactLine = [gym?.address, gym?.phone, gym?.tax_id ? `NIT: ${gym.tax_id}` : null]
        .filter(Boolean)
        .join(' · ');
      if (contactLine) {
        doc.fontSize(9).fillColor('#6b7280').text(contactLine, { align: 'center' });
      }
      doc.moveDown(1);
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      doc.moveDown(1);

      // Título
      doc.fontSize(16).fillColor('#111827').text('Comprobante de Compra', { align: 'center' });
      doc.moveDown(1);

      // Datos de la orden y del cliente
      const infoStartY = doc.y;
      doc.fontSize(9).fillColor('#6b7280').text('Ticket', 50, infoStartY);
      doc
        .fontSize(14)
        .fillColor('#1d4ed8')
        .text(ticketLabel, 50, infoStartY + 12);

      doc.fontSize(9).fillColor('#6b7280').text('Fecha', 300, infoStartY);
      doc
        .fontSize(12)
        .fillColor('#111827')
        .text(issuedAt, 300, infoStartY + 12);

      const row2Y = infoStartY + 42;
      doc.fontSize(9).fillColor('#6b7280').text('Cliente', 50, row2Y);
      doc
        .fontSize(12)
        .fillColor('#111827')
        .text(`${order.member.first_name} ${order.member.last_name}`, 50, row2Y + 12);
      let clientLineY = row2Y + 30;
      if (order.member.user?.email) {
        doc.fontSize(9).fillColor('#6b7280').text(order.member.user.email, 50, clientLineY);
        clientLineY += 13;
      }
      if (order.member.phone) {
        doc.fontSize(9).fillColor('#6b7280').text(order.member.phone, 50, clientLineY);
        clientLineY += 13;
      }

      doc.fontSize(9).fillColor('#6b7280').text('Estado', 300, row2Y);
      doc
        .fontSize(12)
        .fillColor('#111827')
        .text(ORDER_STATUS_LABELS[order.status] ?? order.status, 300, row2Y + 12);
      if (attendedBy) {
        doc
          .fontSize(9)
          .fillColor('#6b7280')
          .text('Atendido por', 300, row2Y + 34);
        doc
          .fontSize(10)
          .fillColor('#111827')
          .text(`${attendedBy.first_name} ${attendedBy.last_name}`, 300, row2Y + 46);
      }

      doc.y = Math.max(clientLineY, row2Y + 60) + 5;
      doc.moveDown(0.5);

      // Tabla de productos
      const colProduct = 50;
      const colQty = 300;
      const colUnit = 360;
      const colSubtotal = 460;
      const tableWidth = doc.page.width - 100;

      const tableHeaderY = doc.y;
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text('Producto', colProduct, tableHeaderY)
        .text('Cant.', colQty, tableHeaderY)
        .text('Precio unit.', colUnit, tableHeaderY)
        .text('Subtotal', colSubtotal, tableHeaderY, { width: 90, align: 'right' });
      doc
        .moveTo(50, tableHeaderY + 14)
        .lineTo(50 + tableWidth, tableHeaderY + 14)
        .strokeColor('#e5e7eb')
        .stroke();
      doc.y = tableHeaderY + 20;

      order.items.forEach((item) => {
        const rowY = doc.y;
        doc
          .fontSize(10)
          .fillColor('#111827')
          .text(item.product.name, colProduct, rowY, { width: 230 })
          .text(String(item.quantity), colQty, rowY)
          .text(`$${Number(item.unit_price).toFixed(2)}`, colUnit, rowY)
          .text(`$${Number(item.subtotal).toFixed(2)}`, colSubtotal, rowY, {
            width: 90,
            align: 'right',
          });
        doc.y = rowY + 18;
      });

      doc
        .moveTo(50, doc.y + 2)
        .lineTo(50 + tableWidth, doc.y + 2)
        .strokeColor('#e5e7eb')
        .stroke();
      doc.moveDown(1);

      // Total
      const totalY = doc.y;
      doc.fontSize(13).fillColor('#111827').text('TOTAL', colUnit, totalY);
      doc
        .fontSize(13)
        .fillColor('#111827')
        .text(`$${Number(order.total).toFixed(2)}`, colSubtotal, totalY, {
          width: 90,
          align: 'right',
        });
      doc.y = totalY + 25;
      doc.moveDown(1.5);

      if (order.notes) {
        doc.fontSize(9).fillColor('#6b7280').text(`Notas: ${order.notes}`);
        doc.moveDown(1);
      }

      // Pie de página — posiciones con margen de sobra respecto al margin
      // bottom (50) del documento; si el último renglón queda demasiado
      // pegado al límite, pdfkit interpreta que no cabe y agrega una página
      // en blanco solo para esa línea.
      doc
        .fontSize(9)
        .fillColor('#374151')
        .text('¡Gracias por tu compra!', 50, doc.page.height - 115, {
          align: 'center',
          width: doc.page.width - 100,
        });
      doc
        .fontSize(7)
        .fillColor('#9ca3af')
        .text(
          `Conserva este ticket (${ticketLabel}) como referencia para cualquier reclamo.`,
          50,
          doc.page.height - 98,
          { align: 'center', width: doc.page.width - 100 },
        );
      doc
        .fontSize(7)
        .fillColor('#9ca3af')
        .text(
          'Este comprobante es un resumen interno de la venta y no constituye una factura fiscal (CF/CCF).',
          50,
          doc.page.height - 85,
          { align: 'center', width: doc.page.width - 100 },
        );
      doc
        .fontSize(7)
        .fillColor('#9ca3af')
        .text(
          `Generado el ${new Date().toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })} por GymApp`,
          50,
          doc.page.height - 70,
          { align: 'center', width: doc.page.width - 100 },
        );

      doc.end();
    });
  }

  async isOwnMember(gymId: string, userId: string, memberId: string): Promise<boolean> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId, user_id: userId },
      select: { id: true },
    });
    return !!member;
  }

  async createOrder(gymId: string, dto: CreateOrderDto, createdByUserId?: string) {
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
      // UPDATE ... SET x = x+1 es atómico en Postgres — no hace falta un lock
      // explícito ni un SELECT previo aunque haya ventas concurrentes del mismo gym.
      const counter = await tx.gym.update({
        where: { id: gymId },
        data: { next_ticket_number: { increment: 1 } },
        select: { next_ticket_number: true },
      });
      const ticketNumber = counter.next_ticket_number - 1;

      const o = await tx.marketplaceOrder.create({
        data: {
          gym_id: gymId,
          member_id: dto.member_id,
          total,
          notes: dto.notes,
          ticket_number: ticketNumber,
          created_by: createdByUserId,
          items: { create: items },
        },
        include: {
          member: { select: { id: true, first_name: true, last_name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });

      for (const item of items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            gym_id: gymId,
            product_id: item.product_id,
            type: 'OUT',
            quantity: item.quantity,
            balance_after: updatedProduct.stock,
            reason: `Venta — Orden #${o.id.slice(0, 8)}`,
            related_order_id: o.id,
            created_by: createdByUserId,
          },
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
