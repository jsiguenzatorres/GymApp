import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { healthDataApi, HealthEntry, HealthKind, HealthSummary } from '@/lib/api-client';
import healthSync from '@/lib/health-sync';

const KINDS: Array<{
  kind: HealthKind;
  emoji: string;
  label: string;
  unit: string;
  placeholder: string;
}> = [
  { kind: 'WEIGHT', emoji: '⚖️', label: 'Peso', unit: 'kg', placeholder: 'Ej: 75.5' },
  { kind: 'WATER', emoji: '💧', label: 'Agua', unit: 'ml', placeholder: 'Ej: 500' },
  { kind: 'SLEEP', emoji: '😴', label: 'Sueño', unit: 'min', placeholder: 'Ej: 480 (8h)' },
  { kind: 'STEPS', emoji: '👟', label: 'Pasos', unit: 'pasos', placeholder: 'Ej: 10000' },
];

export default function HealthDataScreen() {
  const { accessToken } = useAuthStore();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [recent, setRecent] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLog, setOpenLog] = useState<HealthKind | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  // D-19: sincronización con Apple Health / Health Connect
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        healthDataApi.summary(accessToken).catch(() => null),
        healthDataApi.list(accessToken, undefined, 30).catch(() => []),
      ]);
      setSummary(s);
      setRecent(r);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    healthSync
      .isAvailable()
      .then(setNativeAvailable)
      .catch(() => setNativeAvailable(false));
  }, []);

  const connectAndSync = async () => {
    if (!accessToken) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const granted = await healthSync.requestPermissions();
      if (!granted) {
        setSyncMessage(
          'No se concedieron permisos. Revisa los ajustes de privacidad de tu teléfono.',
        );
        return;
      }
      const since = new Date();
      since.setDate(since.getDate() - 30); // primera sincronización: últimos 30 días
      const result = await healthSync.syncNow(accessToken, since);
      setSyncMessage(
        result.imported > 0
          ? `✓ ${result.imported} registro(s) sincronizados desde ${healthSync.platformLabel}`
          : `Sin datos nuevos que sincronizar desde ${healthSync.platformLabel}`,
      );
      await load();
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const submit = async () => {
    if (!accessToken || !openLog) return;
    const v = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(v) || v < 0) {
      Alert.alert('Valor inválido', 'Indica un número >= 0');
      return;
    }
    setSaving(true);
    try {
      await healthDataApi.log(accessToken, { kind: openLog, value: v });
      setOpenLog(null);
      setValue('');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!accessToken) return;
    try {
      await healthDataApi.delete(accessToken, id);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>❤️ Datos de salud</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#dc2626" />
          </View>
        ) : (
          <>
            {/* Resumen */}
            {summary && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Tu última info</Text>
                <View style={styles.summaryGrid}>
                  {(['WEIGHT', 'WATER', 'SLEEP', 'STEPS'] as HealthKind[]).map((k) => {
                    const meta = KINDS.find((x) => x.kind === k)!;
                    const latest = summary.latest[k];
                    return (
                      <View key={k} style={styles.summaryItem}>
                        <Text style={styles.summaryEmoji}>{meta.emoji}</Text>
                        <Text style={styles.summaryValue}>
                          {latest ? Number(latest.value).toFixed(k === 'WEIGHT' ? 1 : 0) : '—'}
                        </Text>
                        <Text style={styles.summaryUnit}>{meta.unit}</Text>
                        <Text style={styles.summaryLabel}>{meta.label}</Text>
                      </View>
                    );
                  })}
                </View>
                {summary.weight_trend && (
                  <View style={styles.trendBox}>
                    <Text style={styles.trendLabel}>Cambio de peso últimos 30 días:</Text>
                    <Text
                      style={[
                        styles.trendValue,
                        {
                          color:
                            summary.weight_trend.delta_kg > 0
                              ? '#dc2626'
                              : summary.weight_trend.delta_kg < 0
                                ? '#15803d'
                                : '#6b7280',
                        },
                      ]}
                    >
                      {summary.weight_trend.delta_kg > 0 ? '+' : ''}
                      {summary.weight_trend.delta_kg.toFixed(1)} kg
                    </Text>
                  </View>
                )}
                {summary.water_avg_ml_7d > 0 && (
                  <View style={styles.trendBox}>
                    <Text style={styles.trendLabel}>Agua promedio últimos 7 días:</Text>
                    <Text style={[styles.trendValue, { color: '#1d4ed8' }]}>
                      {(summary.water_avg_ml_7d / 1000).toFixed(2)} L/día
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Botones de registro rápido */}
            <Text style={styles.sectionLabel}>Registrar ahora</Text>
            <View style={styles.actionsGrid}>
              {KINDS.map((k) => (
                <TouchableOpacity
                  key={k.kind}
                  style={styles.actionBtn}
                  onPress={() => {
                    setOpenLog(k.kind);
                    setValue('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionEmoji}>{k.emoji}</Text>
                  <Text style={styles.actionLabel}>{k.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Histórico reciente */}
            <Text style={styles.sectionLabel}>Últimos registros (30d)</Text>
            {recent.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>Sin registros aún</Text>
                <Text style={styles.emptyDesc}>
                  Toca uno de los botones de arriba para empezar a llevar control de tu salud
                </Text>
              </View>
            ) : (
              <View style={styles.recentCard}>
                {recent.slice(0, 25).map((e) => {
                  const meta = KINDS.find((x) => x.kind === e.kind);
                  const d = new Date(e.recorded_at);
                  return (
                    <View key={e.id} style={styles.recentRow}>
                      <Text style={styles.recentEmoji}>{meta?.emoji ?? '•'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentValue}>
                          {Number(e.value).toFixed(e.kind === 'WEIGHT' ? 1 : 0)} {e.unit}
                          <Text style={styles.recentKind}> · {meta?.label ?? e.kind}</Text>
                        </Text>
                        <Text style={styles.recentDate}>
                          {d.toLocaleDateString('es-SV', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeEntry(e.id)} style={styles.delBtn}>
                        <Text style={styles.delBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sincronización nativa (D-19) */}
            <View style={styles.syncCard}>
              <Text style={styles.syncTitle}>
                {Platform.OS === 'ios' ? '🍎 Apple Health' : '🩺 Health Connect'}
              </Text>
              {nativeAvailable ? (
                <>
                  <Text style={styles.syncDesc}>
                    Sincroniza tu peso, agua y sueño automáticamente en vez de registrarlos a mano.
                  </Text>
                  <TouchableOpacity
                    style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
                    onPress={connectAndSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.syncBtnText}>
                        Sincronizar con {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {syncMessage && <Text style={styles.syncMessage}>{syncMessage}</Text>}
                </>
              ) : (
                <Text style={styles.syncDesc}>
                  {Platform.OS === 'ios'
                    ? 'Apple Health no está disponible en este dispositivo (requiere iPhone físico, no funciona en simulador).'
                    : 'Health Connect no está disponible — instala la app "Health Connect" desde Play Store.'}
                </Text>
              )}
            </View>
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal de registro */}
      <Modal
        visible={!!openLog}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenLog(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            {openLog &&
              (() => {
                const meta = KINDS.find((x) => x.kind === openLog)!;
                return (
                  <>
                    <Text style={styles.modalTitle}>
                      {meta.emoji} Registrar {meta.label}
                    </Text>
                    <TextInput
                      value={value}
                      onChangeText={setValue}
                      placeholder={meta.placeholder}
                      keyboardType="decimal-pad"
                      style={styles.modalInput}
                      autoFocus
                    />
                    <Text style={styles.modalUnit}>{meta.unit}</Text>
                    <View style={styles.modalActions}>
                      <TouchableOpacity style={styles.modalCancel} onPress={() => setOpenLog(null)}>
                        <Text style={styles.modalCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalSave, saving && { opacity: 0.5 }]}
                        onPress={submit}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.modalSaveText}>Guardar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
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
  center: { paddingVertical: 48, alignItems: 'center' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryItem: {
    flexGrow: 1,
    flexBasis: '47%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  summaryEmoji: { fontSize: 22 },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  summaryUnit: { fontSize: 10, color: '#6b7280' },
  summaryLabel: { fontSize: 11, color: '#374151', marginTop: 2, fontWeight: '600' },
  trendBox: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  trendLabel: { fontSize: 12, color: '#6b7280' },
  trendValue: { fontSize: 14, fontWeight: '800' },

  sectionLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 4 },

  emptyBox: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 6 },
  emptyDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },

  recentCard: { backgroundColor: '#fff', borderRadius: 14 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  recentEmoji: { fontSize: 20 },
  recentValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  recentKind: { fontWeight: '400', color: '#6b7280' },
  recentDate: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  delBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  delBtnText: { color: '#9ca3af', fontSize: 16 },

  syncCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  syncTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  syncDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  syncBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  syncBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  syncMessage: { fontSize: 12, color: '#15803d', fontWeight: '600', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalUnit: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
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
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '800' },
});
