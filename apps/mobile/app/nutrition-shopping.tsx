import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, nutritionApi, ShoppingListResponse } from '@/lib/api-client';

const CATEGORY_EMOJI: Record<string, string> = {
  Proteínas: '🥩',
  Carbohidratos: '🍚',
  Vegetales: '🥦',
  Frutas: '🍎',
  Lácteos: '🥛',
  Otros: '🛒',
};

export default function NutritionShoppingScreen() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<ShoppingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const me = await memberApi.getMe(accessToken);
      const res = await nutritionApi.generateShoppingList(accessToken, me.id);
      setData(res);
      if (!res.success) {
        Alert.alert('Aviso', res.error ?? 'No se pudo generar la lista');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCheck = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const total = data?.categories?.reduce((acc, c) => acc + c.items.length, 0) ?? 0;
  const done = checked.size;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Lista de compras</Text>
        <TouchableOpacity onPress={load} style={styles.headerBtn}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#15803d" />
            <Text style={styles.loadingText}>Generando tu lista personalizada…</Text>
          </View>
        ) : !data?.success || !data.categories?.length ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>No se pudo generar la lista. Intenta de nuevo.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Tu lista para esta semana</Text>
              <Text style={styles.infoDesc}>
                {done}/{total} items marcados
                {data.estimated_cost_usd ? ` · Est: $${data.estimated_cost_usd.toFixed(0)}` : ''}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: total > 0 ? `${(done / total) * 100}%` : '0%' },
                  ]}
                />
              </View>
            </View>

            {/* Categorías */}
            {data.categories.map((cat) => (
              <View key={cat.name} style={styles.catCard}>
                <Text style={styles.catTitle}>
                  {CATEGORY_EMOJI[cat.name] ?? '•'} {cat.name}
                </Text>
                {cat.items.map((item, idx) => {
                  const key = `${cat.name}::${item.name}`;
                  const isChecked = checked.has(key);
                  return (
                    <TouchableOpacity
                      key={`${cat.name}-${idx}`}
                      style={styles.itemRow}
                      onPress={() => toggleCheck(key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, isChecked && styles.itemNameDone]}>
                          {item.name}
                          <Text style={styles.itemQty}> · {item.quantity}</Text>
                        </Text>
                        {item.purpose && <Text style={styles.itemPurpose}>{item.purpose}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Tips */}
            {data.tips?.length > 0 && (
              <View style={styles.tipsCard}>
                <Text style={styles.catTitle}>💡 Consejos</Text>
                {data.tips.map((t, idx) => (
                  <Text key={idx} style={styles.tipItem}>
                    • {t}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 28, color: '#111827', fontWeight: '400' },
  refreshIcon: { fontSize: 20, color: '#15803d', fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  scroll: { padding: 16, gap: 12 },
  center: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },

  infoCard: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    padding: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  infoDesc: { fontSize: 12, color: '#dcfce7', marginTop: 4 },
  progressBar: {
    marginTop: 10,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },

  catCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  catTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#15803d', borderColor: '#15803d' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  itemName: { fontSize: 13, color: '#111827', fontWeight: '600' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#9ca3af', fontWeight: '400' },
  itemQty: { color: '#6b7280', fontWeight: '400' },
  itemPurpose: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  tipsCard: { backgroundColor: '#fef3c7', borderRadius: 14, padding: 14 },
  tipItem: { fontSize: 12, color: '#78350f', marginVertical: 2, lineHeight: 18 },
});
