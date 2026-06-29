import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { gamificationApi, MemberStats, LeaderboardEntry } from '@/lib/api-client';

// ─── TX type labels ───────────────────────────────────────────────────────────
const TX_LABEL: Record<string, { label: string; icon: string }> = {
  CHECK_IN: { label: 'Check-in', icon: '🚪' },
  WORKOUT_COMPLETE: { label: 'Workout completo', icon: '💪' },
  PR_ACHIEVED: { label: 'Nuevo récord', icon: '🏆' },
  BADGE_UNLOCKED: { label: 'Badge desbloqueado', icon: '🎖️' },
  MANUAL: { label: 'Bonus', icon: '⭐' },
};

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'leaderboard' | 'badges';

export default function GamificationScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [s, lb] = await Promise.all([
        gamificationApi.getMyStats(accessToken),
        gamificationApi.getLeaderboard(accessToken),
      ]);
      setStats(s);
      setLeaderboard(lb);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos de gamificación');
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Logros</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Level Hero */}
      {stats && (
        <View style={[styles.heroCard, { backgroundColor: stats.level.color }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroEmoji}>{stats.level.emoji}</Text>
            <View>
              <Text style={styles.heroLevel}>Nivel {stats.level.name}</Text>
              {stats.level.nextName ? (
                <Text style={styles.heroNext}>Próximo: {stats.level.nextName}</Text>
              ) : (
                <Text style={styles.heroNext}>¡Nivel máximo alcanzado!</Text>
              )}
            </View>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroCoins}>{stats.balance.toLocaleString()}</Text>
            <Text style={styles.heroCoinsLabel}>FitCoins</Text>
          </View>
        </View>
      )}

      {/* Progress bar */}
      {stats && stats.level.nextThreshold && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(stats.level.progress * 100)}%`,
                  backgroundColor: stats.level.color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stats.lifetime.toLocaleString()} / {stats.level.nextThreshold.toLocaleString()} pts
            lifetime
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'leaderboard', 'badges'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'overview' ? 'Actividad' : t === 'leaderboard' ? 'Ranking' : 'Badges'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
      >
        {/* CTA Comunidad — retos, leaderboard, recompensas, referidos */}
        <TouchableOpacity
          style={{
            backgroundColor: '#7c3aed',
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
          onPress={() => router.push('/community' as never)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 28 }}>🌟</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Comunidad</Text>
            <Text style={{ color: '#ddd6fe', fontSize: 12, marginTop: 2 }}>
              Retos, ranking, recompensas, referidos
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
        </TouchableOpacity>

        {/* Overview tab */}
        {tab === 'overview' && stats && (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.lifetime.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Pts lifetime</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.balance.toLocaleString()}</Text>
                <Text style={styles.statLabel}>FitCoins</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.badges.length}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>

            {/* Recent transactions */}
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
            {stats.recentTransactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Aún no tienes actividad. ¡Haz check-in para ganar puntos!
                </Text>
              </View>
            ) : (
              stats.recentTransactions.map((tx) => {
                const meta = TX_LABEL[tx.type] ?? { label: tx.type, icon: '⭐' };
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <Text style={styles.txIcon}>{meta.icon}</Text>
                    <View style={styles.txInfo}>
                      <Text style={styles.txLabel}>{tx.description ?? meta.label}</Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.created_at).toLocaleDateString('es-SV', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, tx.amount > 0 ? styles.txPos : styles.txNeg]}>
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <>
            <Text style={styles.sectionTitle}>Top 10 del mes</Text>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Sin datos de ranking todavía</Text>
              </View>
            ) : (
              leaderboard.map((entry) => (
                <View key={entry.member_id} style={styles.lbRow}>
                  <View style={[styles.rankBadge, entry.rank <= 3 && styles.rankBadgeTop]}>
                    <Text style={[styles.rankText, entry.rank <= 3 && styles.rankTextTop]}>
                      {entry.rank === 1
                        ? '🥇'
                        : entry.rank === 2
                          ? '🥈'
                          : entry.rank === 3
                            ? '🥉'
                            : `#${entry.rank}`}
                    </Text>
                  </View>
                  <View style={[styles.lbAvatar, { backgroundColor: entry.level_color }]}>
                    <Text style={styles.lbAvatarText}>
                      {entry.first_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.lbInfo}>
                    <Text style={styles.lbName}>
                      {entry.first_name} {entry.last_name}
                    </Text>
                    <Text style={styles.lbLevel}>
                      {entry.level_emoji} {entry.level_name}
                    </Text>
                  </View>
                  <Text style={styles.lbPts}>{entry.points_lifetime.toLocaleString()} pts</Text>
                </View>
              ))
            )}
          </>
        )}

        {/* Badges tab */}
        {tab === 'badges' && stats && (
          <>
            <Text style={styles.sectionTitle}>Tus badges ({stats.badges.length})</Text>
            {stats.badges.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  ¡Aún no tienes badges! Completa workouts y haz check-in para desbloquearlos.
                </Text>
              </View>
            ) : (
              <View style={styles.badgeGrid}>
                {stats.badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeCard}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    {badge.description && <Text style={styles.badgeDesc}>{badge.description}</Text>}
                    <Text style={styles.badgeDate}>
                      {new Date(badge.earned_at).toLocaleDateString('es-SV', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* How to earn */}
            <Text style={styles.sectionTitle}>Cómo ganar FitCoins</Text>
            {[
              { icon: '🚪', action: 'Check-in al gym', pts: '+10 pts' },
              { icon: '💪', action: 'Completar workout', pts: '+20 pts' },
              { icon: '🏆', action: 'Nuevo récord personal', pts: '+50 pts' },
            ].map((item) => (
              <View key={item.action} style={styles.earnRow}>
                <Text style={styles.earnIcon}>{item.icon}</Text>
                <Text style={styles.earnAction}>{item.action}</Text>
                <View style={styles.earnPtsBadge}>
                  <Text style={styles.earnPtsText}>{item.pts}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },

  // Hero card
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroEmoji: { fontSize: 40 },
  heroLevel: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroNext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  heroRight: { alignItems: 'flex-end' },
  heroCoins: { fontSize: 28, fontWeight: '900', color: '#fff' },
  heroCoinsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Progress
  progressContainer: { marginHorizontal: 16, marginTop: 10 },
  progressTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 4 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  tabTextActive: { color: '#7c3aed' },

  // Body
  body: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#7c3aed' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  // Transactions
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  txIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  txDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '800', minWidth: 50, textAlign: 'right' },
  txPos: { color: '#16a34a' },
  txNeg: { color: '#dc2626' },

  // Leaderboard
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop: { backgroundColor: '#fef9c3' },
  rankText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  rankTextTop: { fontSize: 18 },
  lbAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lbAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  lbInfo: { flex: 1 },
  lbName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  lbLevel: { fontSize: 12, color: '#64748b', marginTop: 1 },
  lbPts: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeIcon: { fontSize: 36, marginBottom: 6 },
  badgeName: { fontSize: 13, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 },
  badgeDate: { fontSize: 10, color: '#94a3b8', marginTop: 4 },

  // Earn info
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  earnIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  earnAction: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  earnPtsBadge: {
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  earnPtsText: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
});
