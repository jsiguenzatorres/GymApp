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
  gamificationApi,
  apiClient,
  MemberProfile,
  MemberHomeStats,
  MemberStats,
} from '@/lib/api-client';
import { ProgressRing } from '@/components/ProgressRing';

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
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
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
  const [home, setHome] = useState<MemberHomeStats | null>(null);
  const [game, setGame] = useState<MemberStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [me, stats, gameStats, unread] = await Promise.all([
        memberApi.getMe(accessToken),
        memberApi.getMyStats(accessToken).catch(() => null),
        gamificationApi.getMyStats(accessToken).catch(() => null),
        apiClient
          .get<{ count: number }>('/api/v1/notifications/unread-count', accessToken)
          .catch(() => ({ count: 0 })),
      ]);
      setProfile(me);
      setHome(stats);
      setGame(gameStats);
      setUnreadCount(unread.count ?? 0);
      setError('');
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
  const activeMembership = profile?.memberships?.find(
    (m) => m.status === 'ACTIVE' || m.status === 'TRIAL',
  );
  const statusKey = activeMembership?.status ?? profile?.status ?? 'EXPIRED';
  const statusColor = STATUS_COLOR[statusKey] ?? '#6b7280';
  const statusLabel = STATUS_LABEL[statusKey] ?? statusKey;

  // ─── Datos para los nuevos bloques ─────────────────────────────────────────
  const streak = home?.streak_days ?? 0;
  const sessionsWeek = home?.sessions_this_week ?? 0;
  const weekGoal = home?.sessions_week_goal ?? 5;
  const weekProgress = Math.min(1, sessionsWeek / weekGoal);

  const levelName = game?.level?.name ?? '—';
  const levelEmoji = game?.level?.emoji ?? '🌱';
  const levelColor = game?.level?.color ?? '#1d4ed8';
  const levelProgress = game?.level?.progress ?? 0;
  const nextLevelName = game?.level?.nextName ?? null;
  const balance = game?.balance ?? home?.points_balance ?? 0;
  const lifetime = game?.lifetime ?? home?.points_lifetime ?? 0;

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
            <Text style={styles.greeting}>Hola, {firstName}</Text>
            <Text style={styles.subtitle}>
              {streak > 0
                ? `🔥 Llevas ${streak} día${streak === 1 ? '' : 's'} entrenando`
                : '¡Empieza tu racha hoy!'}
            </Text>
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
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.avatar, { backgroundColor: '#1d4ed8' }]}
            >
              <Text style={styles.avatarText}>{firstName.slice(0, 2).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO — Racha + Nivel + Semana en una sola fila visual */}
        <View style={styles.heroCard}>
          {/* Racha */}
          <View style={styles.heroCol}>
            <Text style={styles.heroFlame}>🔥</Text>
            <Text style={[styles.heroValue, { color: streak > 0 ? '#ea580c' : '#9ca3af' }]}>
              {streak}
            </Text>
            <Text style={styles.heroLabel}>Días racha</Text>
          </View>

          <View style={styles.heroDivider} />

          {/* Nivel ring */}
          <TouchableOpacity
            style={styles.heroCol}
            onPress={() => router.push('/(tabs)/achievements' as never)}
            activeOpacity={0.7}
          >
            <ProgressRing
              progress={levelProgress}
              color={levelColor}
              size={64}
              strokeWidth={6}
              centerEmoji={levelEmoji}
              centerSub={`${Math.round(levelProgress * 100)}%`}
            />
            <Text style={[styles.heroLabel, { marginTop: 4 }]} numberOfLines={1}>
              {nextLevelName ? `Hacia ${nextLevelName}` : levelName}
            </Text>
          </TouchableOpacity>

          <View style={styles.heroDivider} />

          {/* Semana */}
          <View style={styles.heroCol}>
            <ProgressRing
              progress={weekProgress}
              color="#1d4ed8"
              size={64}
              strokeWidth={6}
              centerText={`${sessionsWeek}/${weekGoal}`}
              centerSub="Semana"
            />
            <Text style={[styles.heroLabel, { marginTop: 4 }]}>Esta semana</Text>
          </View>
        </View>

        {/* Próximo entreno — call-to-action */}
        {home?.next_planned_workout && (
          <TouchableOpacity
            style={styles.nextWorkoutCard}
            onPress={() => router.push('/(tabs)/workout')}
            activeOpacity={0.85}
          >
            <View style={styles.nextWorkoutLeft}>
              <Text style={styles.nextWorkoutLabel}>SIGUIENTE ENTRENO</Text>
              <Text style={styles.nextWorkoutTitle} numberOfLines={1}>
                {home.next_planned_workout.day_name ??
                  `Día ${home.next_planned_workout.day_number ?? 1}`}
              </Text>
              <Text style={styles.nextWorkoutSub} numberOfLines={1}>
                {home.next_planned_workout.plan_name}
              </Text>
            </View>
            <View style={styles.nextWorkoutBtn}>
              <Text style={styles.nextWorkoutBtnText}>Empezar ›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Membresía */}
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
                  {daysUntil(activeMembership.end_date)} días
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noMembership}>Sin membresía activa</Text>
          )}
        </View>

        {/* FitCoins + último PR (lado a lado) */}
        <View style={styles.rowGap}>
          {/* FitCoins con CTA Canjear */}
          <TouchableOpacity
            style={[styles.miniCard, { flex: 1 }]}
            onPress={() => router.push('/(tabs)/achievements' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.miniLabel}>Tus FitCoins</Text>
            <Text style={styles.miniValue}>{balance.toLocaleString()}</Text>
            <Text style={styles.miniHint}>Lifetime: {lifetime.toLocaleString()}</Text>
            <View style={styles.miniBtn}>
              <Text style={styles.miniBtnText}>🎁 Canjear ›</Text>
            </View>
          </TouchableOpacity>

          {/* Último PR */}
          {home?.last_pr ? (
            <View style={[styles.miniCard, { flex: 1 }]}>
              <Text style={styles.miniLabel}>Último récord</Text>
              <Text style={styles.miniValue}>
                {Number(home.last_pr.value).toFixed(1)}
                <Text style={styles.miniUnit}> {home.last_pr.unit}</Text>
              </Text>
              <Text style={styles.miniHint} numberOfLines={1}>
                {home.last_pr.exercise.name}
              </Text>
              <Text style={styles.miniDate}>{formatDate(home.last_pr.achieved_at)}</Text>
            </View>
          ) : (
            <View style={[styles.miniCard, { flex: 1 }]}>
              <Text style={styles.miniLabel}>Récords</Text>
              <Text style={styles.miniValueDim}>—</Text>
              <Text style={styles.miniHint}>Aún sin PRs</Text>
              <Text style={styles.miniHint}>¡Levanta tu primero!</Text>
            </View>
          )}
        </View>

        {/* Acceso rápido — más compacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso rápido</Text>
          <View style={styles.actionsGrid}>
            {[
              { emoji: '📊', label: 'Progreso', onPress: () => router.push('/progress' as never) },
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
                label: 'Citas',
                onPress: () => router.push('/appointments' as never),
              },
              { emoji: '💳', label: 'Pagos', onPress: () => router.push('/payments' as never) },
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
  content: { padding: 20, gap: 14, paddingBottom: 32 },
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

  // ─── HERO ────────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroCol: { alignItems: 'center', flex: 1, gap: 2 },
  heroDivider: { width: 1, height: 56, backgroundColor: '#f3f4f6' },
  heroFlame: { fontSize: 22 },
  heroValue: { fontSize: 28, fontWeight: '800' },
  heroLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textAlign: 'center' },

  // ─── NEXT WORKOUT ────────────────────────────────────────────────────────────
  nextWorkoutCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  nextWorkoutLeft: { flex: 1, gap: 2 },
  nextWorkoutLabel: {
    fontSize: 10,
    color: '#bfdbfe',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextWorkoutTitle: { fontSize: 18, color: '#fff', fontWeight: '800', marginTop: 2 },
  nextWorkoutSub: { fontSize: 12, color: '#dbeafe', marginTop: 2 },
  nextWorkoutBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  nextWorkoutBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },

  // ─── CARDS ──────────────────────────────────────────────────────────────────
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

  // ─── MINI CARDS (FitCoins + PR) ─────────────────────────────────────────────
  rowGap: { flexDirection: 'row', gap: 12 },
  miniCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 2,
  },
  miniLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  miniValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  miniValueDim: { fontSize: 22, fontWeight: '800', color: '#d1d5db', marginTop: 2 },
  miniUnit: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  miniHint: { fontSize: 11, color: '#6b7280' },
  miniDate: { fontSize: 10, color: '#9ca3af' },
  miniBtn: {
    marginTop: 8,
    backgroundColor: '#fef3c7',
    paddingVertical: 5,
    borderRadius: 100,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
  },
  miniBtnText: { color: '#b45309', fontSize: 11, fontWeight: '700' },

  // ─── QUICK ACTIONS ──────────────────────────────────────────────────────────
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '22%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },

  errorText: { fontSize: 15, color: '#dc2626' },
  retryBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
