import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, memberApi, sessionApi } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetLog {
  id: string;
  exercise: { name: string };
  set_number: number;
  reps?: number;
  weight_kg?: number;
  logged?: boolean;
}

interface SessionDetail {
  id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
  perceived_effort?: number;
  notes?: string;
  plan: { name: string } | null;
  sets: SetLog[];
}

interface SessionSummary {
  id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  plan: { name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const date = new Date(iso);
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function groupSetsByExercise(sets: SetLog[]): { name: string; sets: SetLog[] }[] {
  const map = new Map<string, SetLog[]>();
  for (const s of sets) {
    const name = s.exercise?.name ?? 'Ejercicio';
    if (!map.has(name)) map.set(name, []);
    (map.get(name) ?? []).push(s);
  }
  return Array.from(map.entries()).map(([name, sets]) => ({ name, sets }));
}

// ─── Status Icon ─────────────────────────────────────────────────────────────

function StatusCircle({ status }: { status: string }) {
  let bg = styles.circleGray;
  let label = '—';

  if (status === 'COMPLETED') {
    bg = styles.circleGreen;
    label = '✓';
  } else if (status === 'IN_PROGRESS') {
    bg = styles.circleBlue;
    label = '●';
  }

  return (
    <View style={[styles.circle, bg]}>
      <Text style={styles.circleLabel}>{label}</Text>
    </View>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionSummary;
  expanded: boolean;
  detail: SessionDetail | undefined;
  loadingDetail: boolean;
  onToggle: (id: string) => void;
}

function SessionCard({ session, expanded, detail, loadingDetail, onToggle }: SessionCardProps) {
  const planName = session.plan?.name ?? 'Sesión libre';
  const dateStr = formatDate(session.started_at);
  const duration = detail?.duration_seconds ? formatDuration(detail.duration_seconds) : null;
  const effort = detail?.perceived_effort ?? null;
  const grouped = detail ? groupSetsByExercise(detail.sets) : [];

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => onToggle(session.id)} style={styles.card}>
      {/* Collapsed header row */}
      <View style={styles.cardHeader}>
        <StatusCircle status={session.status} />

        <View style={styles.cardCenter}>
          <Text style={styles.planName} numberOfLines={1}>
            {planName}
          </Text>
          <Text style={styles.dateText}>
            {dateStr}
            {duration ? `  ·  ${duration}` : ''}
          </Text>
        </View>

        <View style={styles.cardRight}>
          {effort !== null && (
            <View style={styles.effortBadge}>
              <Text style={styles.effortText}>Esfuerzo: {effort}/10</Text>
            </View>
          )}
          <Text style={styles.chevron}>{expanded ? '‹' : '›'}</Text>
        </View>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.expandedContainer}>
          {loadingDetail ? (
            <ActivityIndicator size="small" color="#1d4ed8" style={styles.detailSpinner} />
          ) : detail ? (
            <>
              {/* Sets table */}
              {grouped.length === 0 ? (
                <Text style={styles.emptyDetail}>No hay sets registrados</Text>
              ) : (
                <>
                  {/* Table header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.colExercise, styles.tableHeaderText]}>Ejercicio</Text>
                    <Text style={[styles.colSet, styles.tableHeaderText]}>Set</Text>
                    <Text style={[styles.colReps, styles.tableHeaderText]}>Reps</Text>
                    <Text style={[styles.colKg, styles.tableHeaderText]}>kg</Text>
                  </View>
                  <View style={styles.divider} />

                  {grouped.map((group) => (
                    <View key={group.name}>
                      {/* Exercise subheader */}
                      <Text style={styles.exerciseSubheader}>{group.name}</Text>
                      {group.sets.map((set) => (
                        <View key={set.id} style={styles.tableRow}>
                          <Text style={[styles.colExercise, styles.tableCell]} />
                          <Text style={[styles.colSet, styles.tableCell]}>{set.set_number}</Text>
                          <Text style={[styles.colReps, styles.tableCell]}>
                            {set.reps !== undefined ? set.reps : '—'}
                          </Text>
                          <Text style={[styles.colKg, styles.tableCell]}>
                            {set.weight_kg !== undefined ? set.weight_kg : '—'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </>
              )}

              {/* Notes */}
              {detail.notes ? <Text style={styles.notes}>{detail.notes}</Text> : null}
            </>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, SessionDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch member id
  const { data: meData } = useQuery({
    queryKey: ['me', accessToken],
    queryFn: () => memberApi.getMe(accessToken ?? ''),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });

  const memberId = meData?.id;

  // Fetch sessions list
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    refetch,
  } = useQuery({
    queryKey: ['workout-sessions', memberId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SessionSummary[] }>(
        `/api/v1/members/${memberId}/workout-sessions?limit=30&page=1`,
        accessToken ?? undefined,
      );
      return res.data ?? [];
    },
    enabled: !!memberId && !!accessToken,
    staleTime: 60 * 1000,
  });

  const sessions: SessionSummary[] = sessionsData ?? [];

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Toggle expanded + lazy-load detail
  const handleToggle = useCallback(
    async (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
        return;
      }
      setExpandedId(id);
      if (!detailMap[id]) {
        setLoadingDetailId(id);
        try {
          const detail = await sessionApi.getDetail(accessToken ?? '', id);
          setDetailMap((prev) => ({ ...prev, [id]: detail }));
        } catch {
          // keep expanded, will show nothing
        } finally {
          setLoadingDetailId(null);
        }
      }
    },
    [expandedId, detailMap, accessToken],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Body */}
      {loadingSessions && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#1d4ed8"
              colors={['#1d4ed8']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏋️</Text>
              <Text style={styles.emptyText}>Aún no has entrenado</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              expanded={expandedId === item.id}
              detail={detailMap[item.id]}
              loadingDetail={loadingDetailId === item.id}
              onToggle={handleToggle}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 80,
  },
  backText: {
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    minWidth: 80,
  },

  // List
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
  },

  // Loading / centered
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardCenter: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },

  // Status circle
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  circleGreen: {
    backgroundColor: '#dcfce7',
  },
  circleBlue: {
    backgroundColor: '#dbeafe',
  },
  circleGray: {
    backgroundColor: '#f3f4f6',
  },
  circleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // Card text
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  chevron: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '400',
  },

  // Effort badge
  effortBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  effortText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '600',
  },

  // Expanded section
  expandedContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    backgroundColor: '#fafafa',
  },
  detailSpinner: {
    marginVertical: 12,
  },
  emptyDetail: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Sets table
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 6,
  },
  exerciseSubheader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
  },

  // Column widths
  colExercise: {
    flex: 3,
  },
  colSet: {
    flex: 1,
    textAlign: 'center',
  },
  colReps: {
    flex: 1,
    textAlign: 'center',
  },
  colKg: {
    flex: 1,
    textAlign: 'center',
  },

  // Notes
  notes: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Circle labels adjusted per status
  circleLabelGreen: {
    color: '#16a34a',
  },
  circleLabelBlue: {
    color: '#1d4ed8',
  },
  circleLabelGray: {
    color: '#6b7280',
  },
});
