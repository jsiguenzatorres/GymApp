import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore } from '@/store/auth.store';
import {
  marketplaceApi,
  ordersApi,
  creditApi,
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
  const [view, setView] = useState<'store' | 'orders' | 'camera'>('store');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [photoMatches, setPhotoMatches] = useState<
    Array<{ id: string; name: string; price: string; confidence: number }>
  >([]);

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

  // Credit (E5)
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  const loadCredit = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await creditApi.getMyBalance(accessToken);
      setCreditBalance(res.balance_usd);
    } catch {
      setCreditBalance(null);
    }
  }, [accessToken]);

  useEffect(() => {
    loadCredit();
  }, [loadCredit]);

  const repeatOrder = useCallback(
    (order: MarketplaceOrder) => {
      // Repuebla el carrito con los items del pedido y cambia a vista tienda
      const next: Record<string, number> = {};
      for (const it of order.items ?? []) {
        // Solo agregar si el producto sigue disponible
        const matched = products.find((p) => p.id === it.product?.id && p.is_active);
        if (matched) {
          next[matched.id] = (next[matched.id] ?? 0) + it.quantity;
        }
      }
      if (Object.keys(next).length === 0) {
        Alert.alert(
          'No disponible',
          'Los productos de este pedido ya no están en el catálogo. Habla con tu gym.',
        );
        return;
      }
      setCart(next);
      setView('store');
      Alert.alert('Listo', 'Tu carrito se llenó con los productos del pedido anterior.');
    },
    [products],
  );

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

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a la cámara para identificar productos.',
        );
        return;
      }
    }
    setPhotoUri(null);
    setPhotoMatches([]);
    setView('camera');
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (!photo) return;
      setPhotoUri(photo.uri);
      if (photo.base64 && accessToken) {
        setIdentifying(true);
        try {
          const result = await marketplaceApi.identifyByPhoto(
            accessToken,
            photo.base64,
            'image/jpeg',
          );
          setPhotoMatches(result.matches ?? []);
          if ((result.matches ?? []).length === 0) {
            Alert.alert(
              'Sin coincidencias',
              'No encontramos productos similares. Intenta con otra foto.',
            );
          }
        } catch {
          Alert.alert('Error', 'No se pudo identificar el producto. Intenta de nuevo.');
        } finally {
          setIdentifying(false);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo capturar la foto.');
    }
  };

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
        <TouchableOpacity
          style={[styles.tab, view === 'camera' && styles.tabActive]}
          onPress={openCamera}
        >
          <Text style={[styles.tabText, view === 'camera' && styles.tabTextActive]}>📷 Foto</Text>
        </TouchableOpacity>
      </View>

      {/* ── CAMERA VIEW ── */}
      {view === 'camera' && (
        <View style={styles.cameraContainer}>
          {!photoUri ? (
            <>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
              <View style={styles.cameraControls}>
                <TouchableOpacity onPress={() => setView('store')} style={styles.cameraCancelBtn}>
                  <Text style={styles.cameraCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={capturePhoto} style={styles.captureBtn}>
                  <View style={styles.captureInner} />
                </TouchableOpacity>
                <View style={{ width: 70 }} />
              </View>
              <Text style={styles.cameraHint}>Apunta al producto para identificarlo</Text>
            </>
          ) : (
            <ScrollView contentContainerStyle={styles.photoResultContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              {identifying ? (
                <View style={styles.identifyingRow}>
                  <ActivityIndicator color="#1d4ed8" />
                  <Text style={styles.identifyingText}>Identificando producto…</Text>
                </View>
              ) : photoMatches.length > 0 ? (
                <>
                  <Text style={styles.matchesTitle}>Productos encontrados</Text>
                  {photoMatches.map((match) => (
                    <View key={match.id} style={styles.matchCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.matchName}>{match.name}</Text>
                        <Text style={styles.matchConfidence}>
                          Coincidencia: {Math.round(match.confidence * 100)}%
                        </Text>
                      </View>
                      <View style={styles.matchRight}>
                        <Text style={styles.matchPrice}>${parseFloat(match.price).toFixed(2)}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            addToCart(match.id);
                            setView('store');
                          }}
                          style={styles.matchAddBtn}
                        >
                          <Text style={styles.matchAddText}>+ Agregar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  setPhotoUri(null);
                  setPhotoMatches([]);
                }}
                style={styles.retakeBtn}
              >
                <Text style={styles.retakeBtnText}>📷 Tomar otra foto</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}

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
                    <TouchableOpacity
                      style={styles.repeatBtn}
                      onPress={() => repeatOrder(order)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.repeatBtnText}>🔄 Repetir</Text>
                    </TouchableOpacity>
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
          {/* Credit balance card (E5) */}
          {creditBalance !== null && (
            <View
              style={[
                styles.creditCard,
                {
                  backgroundColor: creditBalance >= 0 ? '#dcfce7' : '#fee2e2',
                  borderColor: creditBalance >= 0 ? '#bbf7d0' : '#fecaca',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.creditLabel}>
                  {creditBalance >= 0 ? 'Saldo de crédito' : 'Adeudo con el gym'}
                </Text>
                <Text
                  style={[
                    styles.creditValue,
                    { color: creditBalance >= 0 ? '#15803d' : '#dc2626' },
                  ]}
                >
                  {creditBalance < 0 ? '-' : ''}${Math.abs(creditBalance).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.creditEmoji}>{creditBalance >= 0 ? '💳' : '⚠️'}</Text>
            </View>
          )}

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
  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  cameraCancelBtn: { padding: 12 },
  cameraCancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  cameraHint: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  photoResultContainer: { padding: 16, gap: 16, paddingBottom: 60 },
  photoPreview: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#e5e7eb' },
  identifyingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  identifyingText: { color: '#374151', fontSize: 14 },
  matchesTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  matchName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  matchConfidence: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  matchRight: { alignItems: 'flex-end', gap: 6 },
  matchPrice: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  matchAddBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchAddText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  retakeBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  retakeBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },

  // E5 — Credit card + repeat order
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  creditLabel: { fontSize: 11, color: '#6b7280', fontWeight: '700', letterSpacing: 0.5 },
  creditValue: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  creditEmoji: { fontSize: 28 },
  repeatBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  repeatBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
