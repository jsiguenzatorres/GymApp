import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import {
  marketplaceApi,
  ordersApi,
  Product,
  ProductCategory,
  MarketplaceOrder,
} from '@/lib/api-client';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  READY: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};
const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: '#d97706',
  CONFIRMED: '#2563eb',
  READY: '#16a34a',
  DELIVERED: '#6b7280',
  CANCELLED: '#dc2626',
};

export default function MarketplaceScreen() {
  const { accessToken } = useAuthStore();
  const [view, setView] = useState<'store' | 'orders'>('store');

  // Store state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [cats, prods] = await Promise.all([
        marketplaceApi.getCategories(accessToken),
        marketplaceApi.getProducts(accessToken, selectedCategory ?? undefined),
      ]);
      setCategories(cats ?? []);
      setProducts((prods ?? []).filter((p) => p.is_active));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, selectedCategory]);

  const loadOrders = useCallback(async () => {
    if (!accessToken) return;
    setOrdersLoading(true);
    try {
      const res = await ordersApi.getMyOrders(accessToken);
      setOrders(res.data ?? []);
    } catch {
      // silent
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (view === 'orders') loadOrders();
  }, [view, loadOrders]);

  const changeCategory = (catId: string | null) => {
    setSelectedCategory(catId);
    setLoading(true);
  };

  const addToCart = (productId: string) =>
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));

  const removeFromCart = (productId: string) =>
    setCart((prev) => {
      const next = { ...prev };
      if ((next[productId] ?? 0) <= 1) delete next[productId];
      else next[productId]--;
      return next;
    });

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((p) => p.id === id);
    return sum + (p ? parseFloat(p.price) * qty : 0);
  }, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const placeOrder = async () => {
    if (!accessToken || cartCount === 0) return;
    const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
    setOrdering(true);
    try {
      await marketplaceApi.createOrder(accessToken, { items });
      setCart({});
      Alert.alert(
        '¡Pedido realizado!',
        'Tu pedido ha sido registrado. El staff te lo entregará pronto.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Error', 'No se pudo procesar el pedido. Intenta de nuevo.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Marketplace</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Tab switch */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, view === 'store' && styles.tabActive]}
          onPress={() => setView('store')}
        >
          <Text style={[styles.tabText, view === 'store' && styles.tabTextActive]}>🛒 Tienda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'orders' && styles.tabActive]}
          onPress={() => setView('orders')}
        >
          <Text style={[styles.tabText, view === 'orders' && styles.tabTextActive]}>
            📦 Mis pedidos
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ORDERS VIEW ── */}
      {view === 'orders' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {ordersLoading ? (
            <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
          ) : orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyText}>Sin pedidos aún</Text>
            </View>
          ) : (
            orders.map((order) => {
              const statusColor = ORDER_STATUS_COLOR[order.status] ?? '#6b7280';
              const statusLabel = ORDER_STATUS_LABEL[order.status] ?? order.status;
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('es-SV', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  {(order.items ?? []).map((item) => (
                    <View key={item.id} style={styles.orderItem}>
                      <Text style={styles.orderItemName}>{item.product.name}</Text>
                      <Text style={styles.orderItemMeta}>
                        {item.quantity}× · ${parseFloat(item.unit_price).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>
                      Total: ${parseFloat(order.total_amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── STORE VIEW ── */}
      {view === 'store' && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#1d4ed8"
            />
          }
        >
          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <TouchableOpacity
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => changeCategory(null)}
            >
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedCategory === c.id && styles.chipActive]}
                onPress={() => changeCategory(c.id)}
              >
                <Text style={[styles.chipText, selectedCategory === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products */}
          {loading ? (
            <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
          ) : products.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyText}>Sin productos disponibles</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map((p) => {
                const qty = cart[p.id] ?? 0;
                const outOfStock = p.stock === 0;
                return (
                  <View key={p.id} style={styles.productCard}>
                    <View style={styles.productImg}>
                      <Text style={styles.productEmoji}>🛍️</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {p.name}
                      </Text>
                      {p.category?.name && <Text style={styles.productCat}>{p.category.name}</Text>}
                      <View style={styles.productFooter}>
                        <Text style={styles.productPrice}>${parseFloat(p.price).toFixed(2)}</Text>
                        {outOfStock ? (
                          <Text style={styles.outOfStock}>Sin stock</Text>
                        ) : qty === 0 ? (
                          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(p.id)}>
                            <Text style={styles.addBtnText}>+ Añadir</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.qtyRow}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => removeFromCart(p.id)}
                            >
                              <Text style={styles.qtyBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyNum}>{qty}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(p.id)}>
                              <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cart bar */}
      {view === 'store' && cartCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>
              {cartCount} {cartCount === 1 ? 'producto' : 'productos'}
            </Text>
            <Text style={styles.cartTotal}>Total: ${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderBtn, ordering && { opacity: 0.6 }]}
            onPress={placeOrder}
            disabled={ordering}
          >
            {ordering ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.orderBtnText}>Pedir →</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  backText: { color: '#1d4ed8', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1d4ed8' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#1d4ed8', fontWeight: '700' },
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  productImg: {
    height: 90,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: { fontSize: 36 },
  productInfo: { padding: 12, gap: 4 },
  productName: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  productCat: { fontSize: 11, color: '#9ca3af' },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#1d4ed8' },
  outOfStock: { fontSize: 11, color: '#dc2626', fontWeight: '500' },
  addBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { color: '#1d4ed8', fontSize: 16, fontWeight: '700', lineHeight: 20 },
  qtyNum: { fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 16, textAlign: 'center' },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartCount: { color: '#d1d5db', fontSize: 12 },
  cartTotal: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  orderBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  orderBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Orders
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 13, color: '#6b7280' },
  statusBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  orderItemName: { fontSize: 14, color: '#374151', flex: 1 },
  orderItemMeta: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  orderTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },
});
