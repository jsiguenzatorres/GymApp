import { serverFetch } from '@/lib/server-api';
import Link from 'next/link';
import { Package, ShoppingCart, Tag, TrendingUp, Plus, Edit } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  _count: { products: number };
}

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Sin stock
      </span>
    );
  if (stock <= 5)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Stock bajo: {stock}
      </span>
    );
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      {stock} uds
    </span>
  );
}

export default async function MarketplacePage() {
  const [rawProducts, rawCategories, rawStats] = await Promise.all([
    serverFetch<Product[]>('/api/v1/products').catch(() => null),
    serverFetch<Category[]>('/api/v1/product-categories').catch(() => null),
    serverFetch<Stats>('/api/v1/marketplace/stats').catch(() => null),
  ]);
  const products: Product[] = rawProducts ?? [];
  const categories: Category[] = rawCategories ?? [];
  const stats: Stats = rawStats ?? {
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de productos y pedidos del gym</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketplace/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Pedidos
            {stats.pendingOrders > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {stats.pendingOrders}
              </span>
            )}
          </Link>
          <Link
            href="/marketplace/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Tag className="h-4 w-4" />
            Categorías
          </Link>
          <Link
            href="/marketplace/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Productos activos',
            value: stats.activeProducts,
            icon: Package,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Pedidos totales',
            value: stats.totalOrders,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Pedidos pendientes',
            value: stats.pendingOrders,
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Ingresos ventas',
            value: `$${stats.revenue.toFixed(2)}`,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 self-center">Categoría:</span>
        <Link
          href="/marketplace"
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Todas
        </Link>
        {categories.map((c: Category) => (
          <Link
            key={c.id}
            href={`/marketplace?cat=${c.id}`}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {c.name} ({c._count.products})
          </Link>
        ))}
      </div>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No hay productos todavía</p>
          <Link
            href="/marketplace/products/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Crear primer producto
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p: Product) => (
            <div
              key={p.id}
              className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                !p.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Image */}
              <div className="h-36 rounded-t-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-10 w-10 text-gray-300" />
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{p.name}</p>
                    {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                  </div>
                  <span className="text-sm font-bold text-violet-700 shrink-0">
                    ${Number(p.price).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <StockBadge stock={p.stock} />
                  {!p.is_active && <span className="text-xs text-gray-400">Inactivo</span>}
                </div>

                <Link
                  href={`/marketplace/products/${p.id}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" /> Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
