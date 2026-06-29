import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { communityApi, Challenge, LeaderboardRow, Reward, Referral } from '@/lib/api-client';

type Tab = 'challenges' | 'leaderboard' | 'rewards' | 'referrals';

const LEVEL_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  elite: '👑',
};

export default function CommunityScreen() {
  const { accessToken } = useAuthStore();
  const [tab, setTab] = useState<Tab>('challenges');
  const [loading, setLoading] = useState(false);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [lbScope, setLbScope] = useState<'week' | 'month' | 'lifetime'>('week');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const [refEmail, setRefEmail] = useState('');
  const [refOpen, setRefOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (tab === 'challenges') setChallenges(await communityApi.listChallenges(accessToken));
      else if (tab === 'leaderboard')
        setLeaderboard(await communityApi.leaderboard(accessToken, lbScope));
      else if (tab === 'rewards') setRewards(await communityApi.listRewards(accessToken));
      else if (tab === 'referrals') setReferrals(await communityApi.listReferrals(accessToken));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab, lbScope]);

  useEffect(() => {
    load();
  }, [load]);

  const joinChallenge = async (id: string) => {
    if (!accessToken) return;
    try {
      await communityApi.joinChallenge(accessToken, id);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    }
  };

  const redeemReward = (r: Reward) => {
    Alert.alert('Canjear recompensa', `${r.name} cuesta ${r.cost_points} puntos. ¿Confirmar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Canjear',
        onPress: async () => {
          if (!accessToken) return;
          try {
            await communityApi.redeemReward(accessToken, r.id);
            Alert.alert('Listo', `Pasa por el gym a recoger tu ${r.name}.`);
            await load();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo canjear');
          }
        },
      },
    ]);
  };

  const createReferral = async () => {
    if (!accessToken || !refEmail.trim()) return;
    setSubmitting(true);
    try {
      const r = await communityApi.createReferral(accessToken, refEmail.trim());
      setRefOpen(false);
      setRefEmail('');
      await load();
      // Inmediatamente ofrecer compartir
      const message = `¡Hola! Te invito a entrenar conmigo. Usa el código *${r.code}* al inscribirte y los dos ganamos puntos. 💪`;
      await Share.share({ message }).catch(() => null);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌟 Comunidad</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {(
          [
            { k: 'challenges', l: '🏆 Retos' },
            { k: 'leaderboard', l: '📊 Ranking' },
            { k: 'rewards', l: '🎁 Recompensas' },
            { k: 'referrals', l: '💌 Referidos' },
          ] as { k: Tab; l: string }[]
        ).map((t) => (
          <TouchableOpacity
            key={t.k}
            style={[styles.tab, tab === t.k && styles.tabActive]}
            onPress={() => setTab(t.k)}
          >
            <Text style={[styles.tabText, tab === t.k && styles.tabTextActive]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
        ) : tab === 'challenges' ? (
          challenges.length === 0 ? (
            <Empty emoji="🏆" text="Sin retos activos ahora mismo" />
          ) : (
            challenges.map((c) => {
              const pct =
                c.goal_value > 0 ? Math.min(100, ((c.my?.progress ?? 0) / c.goal_value) * 100) : 0;
              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86_400_000),
              );
              return (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>{c.cover_emoji ?? '🏆'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{c.name}</Text>
                      <Text style={styles.cardDesc}>{c.description}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBox}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: c.my?.completed ? '#15803d' : '#7c3aed',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {c.my?.progress ?? 0} / {c.goal_value}{' '}
                      {c.my?.completed ? '✓ Completado' : `· ${daysLeft}d restantes`}
                    </Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>
                      🎁 {c.reward_points} pts · 👥 {c.participants_count} participantes
                    </Text>
                    {!c.my && (
                      <TouchableOpacity style={styles.joinBtn} onPress={() => joinChallenge(c.id)}>
                        <Text style={styles.joinBtnText}>Unirme</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : tab === 'leaderboard' ? (
          <>
            <View style={styles.scopeRow}>
              {(['week', 'month', 'lifetime'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.scopeChip, lbScope === s && styles.scopeChipActive]}
                  onPress={() => setLbScope(s)}
                >
                  <Text style={[styles.scopeText, lbScope === s && { color: '#fff' }]}>
                    {s === 'week' ? 'Semana' : s === 'month' ? 'Mes' : 'Total'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {leaderboard.length === 0 ? (
              <Empty emoji="📊" text="Sin actividad todavía. ¡Sé el primero!" />
            ) : (
              <View style={styles.card}>
                {leaderboard.map((row) => (
                  <View
                    key={row.member_id}
                    style={[styles.lbRow, row.rank <= 3 && styles.lbRowTop]}
                  >
                    <Text style={[styles.lbRank, row.rank <= 3 && { color: '#b45309' }]}>
                      {row.rank === 1
                        ? '🥇'
                        : row.rank === 2
                          ? '🥈'
                          : row.rank === 3
                            ? '🥉'
                            : `#${row.rank}`}
                    </Text>
                    <Text style={styles.lbName}>
                      {LEVEL_EMOJI[row.loyalty_level] ?? ''} {row.name}
                    </Text>
                    <Text style={styles.lbScore}>{row.score} pts</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : tab === 'rewards' ? (
          rewards.length === 0 ? (
            <Empty emoji="🎁" text="Tu gym aún no publica recompensas" />
          ) : (
            rewards.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{r.cover_emoji ?? '🎁'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    {r.description && <Text style={styles.cardDesc}>{r.description}</Text>}
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    💰 {r.cost_points} pts{r.stock > 0 ? ` · ${r.stock} disponibles` : ''}
                  </Text>
                  <TouchableOpacity style={styles.joinBtn} onPress={() => redeemReward(r)}>
                    <Text style={styles.joinBtnText}>Canjear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          /* referrals */
          <>
            <TouchableOpacity style={styles.bigBtn} onPress={() => setRefOpen(true)}>
              <Text style={styles.bigBtnText}>+ Invitar amigo</Text>
            </TouchableOpacity>
            {referrals.length === 0 ? (
              <Empty
                emoji="💌"
                text="Aún no has invitado a nadie. Invita y ganen puntos los dos."
              />
            ) : (
              <View style={styles.card}>
                {referrals.map((r) => (
                  <View key={r.id} style={styles.refRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.refEmail}>{r.referred_email}</Text>
                      <Text style={styles.refCode}>Código: {r.code}</Text>
                    </View>
                    <View
                      style={[
                        styles.refBadge,
                        {
                          backgroundColor:
                            r.status === 'REWARDED'
                              ? '#dcfce7'
                              : r.status === 'REGISTERED'
                                ? '#dbeafe'
                                : '#f3f4f6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.refBadgeText,
                          {
                            color:
                              r.status === 'REWARDED'
                                ? '#15803d'
                                : r.status === 'REGISTERED'
                                  ? '#1d4ed8'
                                  : '#6b7280',
                          },
                        ]}
                      >
                        {r.status === 'REWARDED'
                          ? 'Recompensado'
                          : r.status === 'REGISTERED'
                            ? 'Registrado'
                            : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal nueva referral */}
      <Modal
        visible={refOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRefOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💌 Invitar amigo</Text>
            <Text style={styles.modalDesc}>
              Mete el email de tu amigo. Cuando se registre con tu código, los dos ganan puntos.
            </Text>
            <TextInput
              value={refEmail}
              onChangeText={setRefEmail}
              placeholder="amigo@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRefOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, (!refEmail.trim() || submitting) && { opacity: 0.5 }]}
                onPress={createReferral}
                disabled={!refEmail.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Generar e invitar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
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

  tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  tabActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  tabText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  scroll: { padding: 16, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMeta: { fontSize: 12, color: '#6b7280', flex: 1 },

  progressBox: { gap: 4 },
  progressBar: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 11, color: '#6b7280' },

  joinBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  scopeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scopeChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  scopeText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lbRowTop: { backgroundColor: '#fef3c7', paddingHorizontal: 8, borderRadius: 8 },
  lbRank: { fontSize: 16, fontWeight: '800', color: '#374151', width: 40 },
  lbName: { flex: 1, fontSize: 13, color: '#111827', fontWeight: '600' },
  lbScore: { fontSize: 14, color: '#7c3aed', fontWeight: '800' },

  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  refEmail: { fontSize: 13, fontWeight: '600', color: '#111827' },
  refCode: { fontSize: 11, color: '#7c3aed', marginTop: 2, fontWeight: '700' },
  refBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  refBadgeText: { fontSize: 10, fontWeight: '700' },

  bigBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bigBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  emptyBox: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalDesc: { fontSize: 12, color: '#6b7280' },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
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
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '800' },
});
