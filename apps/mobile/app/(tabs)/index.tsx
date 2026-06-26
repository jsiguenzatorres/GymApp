import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import {
  memberApi,
  apiClient,
  MemberProfile,
  WorkoutSession,
  PersonalRecord,
} from '@/lib/api-client';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a',
  TRIAL: '#d97706',
  FREEZE: '#6366f1',
  EXPIRED: '#dc2626',
  PRE_CANCEL: '#ea580c',
  CANCELLED: '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  TRIAL: 'Prueba',
  FREEZE: 'Congelada',
  EXPIRED: 'Expirada',
  PRE_CANCEL: 'Pre-cancelación',
  CANCELLED: 'Cancelada',
};

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HomeTab() {
  const { user, accessToken } = useAuthStore();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setProfile(me);
      const [sessRes, prRes, unreadRes] = await Promise.all([
        memberApi.getSessions(me.id, accessToken),
        memberApi.getPRs(me.id, accessToken),
        apiClient
          .get<{ count: number }>('/api/v1/notifications/unread-count', accessToken)
          .catch(() => ({ count: 0 })),
      ]);
      setSessions(sessRes.data ?? []);
      setPrs(prRes ?? []);
      setUnreadCount(unreadRes.count ?? 0);
    } catch {
      setError('No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const activeMembership = profile?.memberships?.find(
    (m) => m.status === 'ACTIVE' || m.status === 'TRIAL',
  );
  const thisMonthSessions = sessions.filter((s) => {
    const d = new Date(s.started_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastSession = sessions[0] ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const firstName = profile?.first_name ?? user?.firstName ?? 'Miembro';
  const statusKey = activeMembership?.status ?? profile?.status ?? 'EXPIRED';
  const statusColor = STATUS_COLOR[statusKey] ?? '#6b7280';
  const statusLabel = STATUS_LABEL[statusKey] ?? statusKey;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/notifications' as never)}
              style={styles.bellBtn}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={[styles.avatar, { backgroundColor: '#1d4ed8' }]}>
              <Text style={styles.avatarText}>{firstName.slice(0, 2).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Membership card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Membresía</Text>
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          {activeMembership ? (
            <>
              <Text style={styles.planName}>{activeMembership.type.name}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardMeta}>Vence: {formatDate(activeMembership.end_date)}</Text>
                <Text
                  style={[
                    styles.daysLeft,
                    daysUntil(activeMembership.end_date) <= 7 && { color: '#dc2626' },
                  ]}
                >
                  {daysUntil(activeMembership.end_date)} días restantes
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noMembership}>Sin membresía activa</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{thisMonthSessions.length}</Text>
            <Text style={styles.statLabel}>Sesiones este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{prs.length}</Text>
            <Text style={styles.statLabel}>Récords personales</Text>
          </View>
        </View>

        {/* Last session */}
        {lastSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Última sesión</Text>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionPlan}>{lastSession.plan?.name ?? 'Sesión libre'}</Text>
              <Text style={styles.sessionDate}>{formatDate(lastSession.started_at)}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#dbeafe', alignSelf: 'flex-start', marginTop: 6 },
                ]}
              >
                <Text style={[styles.badgeText, { color: '#1d4ed8' }]}>
                  {lastSession.status === 'COMPLETED' ? 'Completada' : lastSession.status}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso rápido</Text>
          <View style={styles.actionsGrid}>
            {[
              { emoji: '🏋️', label: 'Entrenar', onPress: () => router.push('/(tabs)/workout') },
              { emoji: '📱', label: 'Mi QR', onPress: () => router.push('/(tabs)/qr') },
              {
                emoji: '📊',
                label: 'Mi Progreso',
                onPress: () => router.push('/progress' as never),
              },
              { emoji: '📋', label: 'Historial', onPress: () => router.push('/history' as never) },
              {
                emoji: '💪',
                label: 'Ejercicios',
                onPress: () => router.push('/exercises' as never),
              },
              { emoji: '🏢', label: 'Mi Gym', onPress: () => router.push('/gym' as never) },
              { emoji: '🗓️', label: 'Clases', onPress: () => router.push('/classes' as never) },
              { emoji: '🛒', label: 'Tienda', onPress: () => router.push('/marketplace') },
              { emoji: '🥗', label: 'Nutrición', onPress: () => router.push('/nutrition') },
              { emoji: '💜', label: 'Chat ARIA', onPress: () => router.push('/aria') },
              {
                emoji: '📅',
                label: 'Mis Citas',
                onPress: () => router.push('/appointments' as never),
              },
              { emoji: '💳', label: 'Mis Pagos', onPress: () => router.push('/payments' as never) },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress}>
                <Text style={styles.actionEmoji}>{a.emoji}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    gap: 16,
  },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 22 },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeCount: { color: '#fff', fontSize: 9, fontWeight: '800' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  cardMeta: { fontSize: 13, color: '#6b7280' },
  daysLeft: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  noMembership: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  badge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1d4ed8' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionPlan: { fontSize: 15, fontWeight: '600', color: '#111827' },
  sessionDate: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  errorText: { fontSize: 15, color: '#dc2626' },
  retryBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
