import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { notifPrefsApi, NotifKind, NotifPref } from '@/lib/api-client';

const KINDS_META: Array<{
  kind: NotifKind;
  emoji: string;
  title: string;
  desc: string;
  group: 'Nutrición' | 'Entreno' | 'Sistema';
}> = [
  {
    kind: 'MEAL_REMINDER_BREAKFAST',
    emoji: '🍳',
    title: 'Recordatorio desayuno',
    desc: 'Si no registraste desayuno antes de las 11am',
    group: 'Nutrición',
  },
  {
    kind: 'MEAL_REMINDER_LUNCH',
    emoji: '🍽️',
    title: 'Recordatorio almuerzo',
    desc: 'Si no registraste almuerzo antes de las 16:00',
    group: 'Nutrición',
  },
  {
    kind: 'MEAL_REMINDER_DINNER',
    emoji: '🌙',
    title: 'Recordatorio cena',
    desc: 'Si no registraste cena antes de las 21:00',
    group: 'Nutrición',
  },
  {
    kind: 'WATER_HOURLY',
    emoji: '💧',
    title: 'Hidratación cada hora',
    desc: 'Te recordamos beber agua durante el día',
    group: 'Nutrición',
  },
  {
    kind: 'WORKOUT_REMINDER',
    emoji: '💪',
    title: 'Recordatorio entreno',
    desc: 'Si llevas 2+ días sin entrenar',
    group: 'Entreno',
  },
  {
    kind: 'STREAK_AT_RISK',
    emoji: '🔥',
    title: 'Racha en riesgo',
    desc: 'Cuando tu racha está a punto de romperse',
    group: 'Sistema',
  },
];

export default function NotificationPrefsScreen() {
  const { accessToken } = useAuthStore();
  const [prefs, setPrefs] = useState<NotifPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      let list = await notifPrefsApi.list(accessToken);
      // Si no hay prefs, hacer seed
      if (list.length === 0) {
        list = await notifPrefsApi.seed(accessToken);
      }
      setPrefs(list);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (kind: NotifKind, enabled: boolean) => {
    if (!accessToken) return;
    setSaving(kind);
    try {
      const updated = await notifPrefsApi.upsert(accessToken, { kind, enabled });
      setPrefs((prev) => {
        const idx = prev.findIndex((p) => p.kind === kind);
        if (idx === -1) return [...prev, updated];
        return prev.map((p) => (p.kind === kind ? updated : p));
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setSaving(null);
    }
  };

  const isEnabled = (kind: NotifKind) => prefs.find((p) => p.kind === kind)?.enabled ?? false;
  const timeOf = (kind: NotifKind) => prefs.find((p) => p.kind === kind)?.time_of_day ?? null;

  const groups = ['Nutrición', 'Entreno', 'Sistema'] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notificaciones</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Configura qué notificaciones quieres recibir. El envío real comienza cuando se
            despliegue el scheduler de notificaciones (Fase 2).
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : (
          groups.map((group) => {
            const items = KINDS_META.filter((k) => k.group === group);
            return (
              <View key={group}>
                <Text style={styles.groupLabel}>{group}</Text>
                <View style={styles.groupCard}>
                  {items.map((meta, i) => (
                    <View
                      key={meta.kind}
                      style={[styles.row, i < items.length - 1 && styles.rowBorder]}
                    >
                      <Text style={styles.rowEmoji}>{meta.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{meta.title}</Text>
                        <Text style={styles.rowDesc}>{meta.desc}</Text>
                        {timeOf(meta.kind) && (
                          <Text style={styles.rowTime}>A las {timeOf(meta.kind)}</Text>
                        )}
                      </View>
                      <Switch
                        value={isEnabled(meta.kind)}
                        onValueChange={(v) => toggle(meta.kind, v)}
                        disabled={saving === meta.kind}
                        trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
                        thumbColor={isEnabled(meta.kind) ? '#7c3aed' : '#f4f4f5'}
                      />
                    </View>
                  ))}
                </View>
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

  infoCard: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12 },
  infoText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  center: { paddingVertical: 48, alignItems: 'center' },

  groupLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 6,
  },
  groupCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowEmoji: { fontSize: 22 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  rowDesc: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  rowTime: { fontSize: 11, color: '#7c3aed', marginTop: 2, fontWeight: '600' },
});
