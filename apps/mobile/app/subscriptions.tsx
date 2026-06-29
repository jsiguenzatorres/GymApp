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
import { subscriptionsApi, ProductSubscription } from '@/lib/api-client';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Activa', color: '#15803d', bg: '#dcfce7' },
  PAUSED: { label: 'Pausada', color: '#b45309', bg: '#fef3c7' },
  CANCELLED: { label: 'Cancelada', color: '#6b7280', bg: '#f3f4f6' },
};

export default function SubscriptionsScreen() {
  const { accessToken } = useAuthStore();
  const [subs, setSubs] = useState<ProductSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const list = await subscriptionsApi.list(accessToken);
      setSubs(list);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (sub: ProductSubscription) => {
    if (!accessToken) return;
    const newStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await subscriptionsApi.update(accessToken, sub.id, { status: newStatus });
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar');
    }
  };

  const cancel = (sub: ProductSubscription) => {
    Alert.alert('Cancelar suscripción', `¿Cancelar la suscripción a ${sub.product?.name}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          if (!accessToken) return;
          try {
            await subscriptionsApi.cancel(accessToken, sub.id);
            await load();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Error');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔁 Mis suscripciones</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Las suscripciones generan automáticamente una orden cada vez que toca su entrega. Las
            podés pausar o cancelar cuando quieras.
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : subs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔁</Text>
            <Text style={styles.emptyTitle}>Sin suscripciones activas</Text>
            <Text style={styles.emptyDesc}>
              Ve al marketplace y suscríbete a tu suplemento favorito para que te lo dejen
              automáticamente cada N días.
            </Text>
            <TouchableOpacity
              style={styles.gotoBtn}
              onPress={() => router.replace('/marketplace' as never)}
            >
              <Text style={styles.gotoBtnText}>Ir al marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subs.map((sub) => {
            const meta = STATUS_META[sub.status] ?? STATUS_META.CANCELLED;
            const next = new Date(sub.next_delivery_at);
            return (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subName}>{sub.product?.name ?? 'Producto'}</Text>
                    <Text style={styles.subMeta}>
                      {sub.quantity}× cada {sub.frequency_days} días
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <View style={styles.subInfo}>
                  <View>
                    <Text style={styles.subLabel}>Próxima entrega</Text>
                    <Text style={styles.subValue}>
                      {next.toLocaleDateString('es-SV', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.subLabel}>Entregas totales</Text>
                    <Text style={styles.subValue}>{sub.total_deliveries}</Text>
                  </View>
                </View>

                {sub.status !== 'CANCELLED' && (
                  <View style={styles.subActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleStatus(sub)}>
                      <Text style={styles.actionText}>
                        {sub.status === 'ACTIVE' ? '⏸ Pausar' : '▶ Reactivar'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionDanger]}
                      onPress={() => cancel(sub)}
                    >
                      <Text style={[styles.actionText, { color: '#dc2626' }]}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  scroll: { padding: 16, gap: 12 },
  center: { paddingVertical: 64, alignItems: 'center' },

  infoCard: { backgroundColor: '#ede9fe', borderRadius: 10, padding: 12 },
  infoText: { fontSize: 12, color: '#5b21b6', lineHeight: 18 },

  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginTop: 8 },
  emptyDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  gotoBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  gotoBtnText: { color: '#fff', fontWeight: '700' },

  subCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  subInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
  },
  subLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 0.5 },
  subValue: { fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2 },

  subActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  actionDanger: { borderColor: '#fecaca' },
  actionText: { fontSize: 12, fontWeight: '700', color: '#374151' },
});
