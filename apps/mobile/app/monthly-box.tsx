import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { monthlyBoxApi, MonthlyBoxResponse } from '@/lib/api-client';

const STATUS_META: Record<
  string,
  { emoji: string; label: string; color: string; bg: string; desc: string }
> = {
  REQUESTED: {
    emoji: '📝',
    label: 'Solicitada',
    color: '#1d4ed8',
    bg: '#dbeafe',
    desc: 'El gym recibió tu solicitud',
  },
  PREPARING: {
    emoji: '📦',
    label: 'Preparando',
    color: '#b45309',
    bg: '#fef3c7',
    desc: 'Tu caja se está armando',
  },
  READY: {
    emoji: '✅',
    label: 'Lista para recoger',
    color: '#15803d',
    bg: '#dcfce7',
    desc: 'Pasa por el gym a recogerla',
  },
  DELIVERED: {
    emoji: '🎉',
    label: 'Entregada',
    color: '#15803d',
    bg: '#dcfce7',
    desc: '¡Disfruta tu caja!',
  },
  CANCELLED: {
    emoji: '❌',
    label: 'Cancelada',
    color: '#dc2626',
    bg: '#fee2e2',
    desc: 'Tu solicitud fue cancelada',
  },
};

export default function MonthlyBoxScreen() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<MonthlyBoxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await monthlyBoxApi.getCurrent(accessToken);
      setData(res);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cargar la caja');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await monthlyBoxApi.request(accessToken, {
        delivery_address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setShowRequest(false);
      Alert.alert('Listo', 'Tu solicitud fue enviada. El gym se pondrá en contacto contigo.');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo solicitar');
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = data?.my_request ? STATUS_META[data.my_request.status] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Caja del mes</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#b45309" />
          </View>
        ) : !data?.box ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Aún no hay caja publicada</Text>
            <Text style={styles.emptyDesc}>
              Cada mes, tu gym arma una caja especial con productos premium incluida en tu
              suscripción NutriElite. Vuelve pronto.
            </Text>
          </View>
        ) : (
          <>
            {/* Imagen de la caja */}
            {data.box.cover_url && (
              <Image source={{ uri: data.box.cover_url }} style={styles.cover} resizeMode="cover" />
            )}

            {/* Título */}
            <View style={styles.titleCard}>
              <Text style={styles.titleEmoji}>🎁</Text>
              <Text style={styles.title}>{data.box.title}</Text>
              <Text style={styles.month}>
                {new Date(data.box.month + '-01').toLocaleDateString('es-SV', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              {data.box.description && (
                <Text style={styles.description}>{data.box.description}</Text>
              )}
              {data.box.delivery_date && (
                <View style={styles.deliveryBox}>
                  <Text style={styles.deliveryLabel}>📅 Fecha de entrega</Text>
                  <Text style={styles.deliveryDate}>
                    {new Date(data.box.delivery_date).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Contenido */}
            {data.box.contents.length > 0 && (
              <View style={styles.contentsCard}>
                <Text style={styles.cardTitle}>¿Qué incluye?</Text>
                {data.box.contents.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemBullet}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
                    </View>
                    <Text style={styles.itemQty}>
                      {item.quantity}
                      {item.qty_unit ? ` ${item.qty_unit}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Estado de mi solicitud o CTA */}
            {data.my_request && statusMeta ? (
              <View style={[styles.statusCard, { backgroundColor: statusMeta.bg }]}>
                <Text style={styles.statusEmoji}>{statusMeta.emoji}</Text>
                <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
                <Text style={styles.statusDesc}>{statusMeta.desc}</Text>
                <Text style={styles.statusDate}>
                  Solicitada:{' '}
                  {new Date(data.my_request.requested_at).toLocaleDateString('es-SV', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.requestBtn}
                onPress={() => setShowRequest(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.requestBtnText}>📦 Solicitar mi caja del mes</Text>
              </TouchableOpacity>
            )}

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 Incluida en tu NutriElite. Solo puedes solicitar una caja por mes.
              </Text>
            </View>
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal solicitud */}
      <Modal
        visible={showRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequest(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Solicitar mi caja</Text>
            <Text style={styles.modalDesc}>
              ¿Dónde te conviene recibirla? Si no especificas, la recoges en el gym.
            </Text>

            <Text style={styles.modalLabel}>Dirección (opcional)</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Ej: Col. Escalón, calle ABC #123"
              style={styles.modalInput}
              multiline
            />

            <Text style={styles.modalLabel}>Notas (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: tocar timbre, entregar a portero..."
              style={styles.modalInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRequest(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, submitting && { opacity: 0.5 }]}
                onPress={submitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Enviar solicitud</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 8 },
  emptyDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 6, lineHeight: 19 },

  cover: { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#e5e7eb' },

  titleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  titleEmoji: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  month: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'capitalize' },
  description: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 4,
  },
  deliveryBox: {
    marginTop: 12,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deliveryLabel: { fontSize: 11, color: '#78350f', fontWeight: '700' },
  deliveryDate: { fontSize: 16, color: '#b45309', fontWeight: '800', marginTop: 2 },

  contentsCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemBullet: { fontSize: 14, color: '#b45309', fontWeight: '900' },
  itemName: { fontSize: 14, color: '#111827', fontWeight: '600' },
  itemBrand: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  itemQty: { fontSize: 13, color: '#1d4ed8', fontWeight: '700' },

  statusCard: { borderRadius: 14, padding: 20, alignItems: 'center', gap: 4 },
  statusEmoji: { fontSize: 40 },
  statusLabel: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  statusDesc: { fontSize: 13, color: '#374151', textAlign: 'center' },
  statusDate: { fontSize: 11, color: '#6b7280', marginTop: 8 },

  requestBtn: {
    backgroundColor: '#b45309',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  tipBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12 },
  tipText: { fontSize: 12, color: '#78350f', textAlign: 'center', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalDesc: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  modalLabel: { fontSize: 11, color: '#6b7280', fontWeight: '700', marginTop: 6 },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancel: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: { color: '#6b7280', fontWeight: '700' },
  modalSave: {
    flex: 2,
    backgroundColor: '#b45309',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '800' },
});
