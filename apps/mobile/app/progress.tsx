import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, memberApi, VolumeWeeklyResponse } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  started_at: string;
  status: string;
}

interface PersonalRecord {
  id: string;
  value: number;
  unit: string;
  achieved_at: string;
  exercise: { name: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
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

const BAR_WIDTH = 30;
const BAR_MAX_HEIGHT = 120;
const CHART_PADDING_LEFT = 16;
const CHART_PADDING_RIGHT = 16;
const CHART_GAP = 16;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLast6Months(): { label: string; year: number; month: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
}

function countSessionsPerMonth(
  sessions: SessionSummary[],
  buckets: { label: string; year: number; month: number }[],
): number[] {
  return buckets.map(
    ({ year, month }) =>
      sessions.filter((s) => {
        const d = new Date(s.started_at);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
  );
}

function computeCurrentMonthCount(sessions: SessionSummary[]): number {
  const now = new Date();
  return sessions.filter((s) => {
    const d = new Date(s.started_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

function computeLongestStreak(sessions: SessionSummary[]): number {
  if (sessions.length === 0) return 0;

  // Collect unique ISO week keys (year-week)
  const weekSet = new Set<string>();
  sessions.forEach((s) => {
    const d = new Date(s.started_at);
    // ISO week: use Thursday trick
    const day = d.getDay() === 0 ? 7 : d.getDay();
    const thursday = new Date(d);
    thursday.setDate(d.getDate() - day + 4);
    const jan1 = new Date(thursday.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
    weekSet.add(`${thursday.getFullYear()}-${weekNum}`);
  });

  // Sort weeks chronologically
  const sortedWeeks = Array.from(weekSet).sort((a, b) => {
    const [ay, aw] = a.split('-').map(Number);
    const [by, bw] = b.split('-').map(Number);
    return ay !== by ? ay - by : aw - bw;
  });

  if (sortedWeeks.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedWeeks.length; i++) {
    const [py, pw] = sortedWeeks[i - 1].split('-').map(Number);
    const [cy, cw] = sortedWeeks[i].split('-').map(Number);

    // Check if consecutive weeks
    const isConsecutive = (cy === py && cw === pw + 1) || (cy === py + 1 && pw >= 52 && cw === 1);

    if (isConsecutive) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Volume Chart (8 weeks) ──────────────────────────────────────────────────

function VolumeChart({
  weekly,
}: {
  weekly: Array<{ week_start: string; volume_kg: number; sessions: number }>;
}) {
  const maxVol = Math.max(...weekly.map((w) => w.volume_kg), 1);
  const barW = 24;
  const gap = 10;
  const left = 12;
  const right = 12;
  const maxH = 110;
  const totalW = left + right + weekly.length * barW + (weekly.length - 1) * gap;
  const totalH = maxH + 36;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
      <Svg width={totalW} height={totalH}>
        {weekly.map((w, i) => {
          const h = w.volume_kg === 0 ? 2 : (w.volume_kg / maxVol) * maxH;
          const x = left + i * (barW + gap);
          const y = 8 + (maxH - h);
          const isLast = i === weekly.length - 1;
          const d = new Date(w.week_start);
          const label = `${d.getDate()}/${d.getMonth() + 1}`;
          return (
            <React.Fragment key={w.week_start}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={3}
                fill={isLast ? '#1d4ed8' : '#93c5fd'}
                opacity={w.volume_kg === 0 ? 0.25 : 1}
              />
              <SvgText
                x={x + barW / 2}
                y={8 + maxH + 16}
                fontSize="9"
                fill="#6b7280"
                textAnchor="middle"
              >
                {label}
              </SvgText>
              {w.volume_kg > 0 && isLast && (
                <SvgText
                  x={x + barW / 2}
                  y={y - 4}
                  fontSize="9"
                  fill="#1d4ed8"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {Math.round(w.volume_kg / 100) / 10}k
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

function StatCard({ label, value, accent = '#1d4ed8' }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface AttendanceChartProps {
  counts: number[];
  labels: string[];
}

function AttendanceChart({ counts, labels }: AttendanceChartProps) {
  const maxCount = Math.max(...counts, 1);
  const totalBars = labels.length;
  const chartWidth =
    CHART_PADDING_LEFT + CHART_PADDING_RIGHT + totalBars * BAR_WIDTH + (totalBars - 1) * CHART_GAP;
  const chartHeight = BAR_MAX_HEIGHT + 48; // bars + labels below + count above

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Asistencia mensual</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartWidth} height={chartHeight} style={{ marginTop: 8 }}>
          {/* Gridline at max */}
          <Line
            x1={CHART_PADDING_LEFT}
            y1={8}
            x2={chartWidth - CHART_PADDING_RIGHT}
            y2={8}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          {labels.map((label, index) => {
            const count = counts[index];
            const barHeight = count === 0 ? 2 : (count / maxCount) * BAR_MAX_HEIGHT;
            const x = CHART_PADDING_LEFT + index * (BAR_WIDTH + CHART_GAP);
            const y = 8 + (BAR_MAX_HEIGHT - barHeight);
            const labelY = 8 + BAR_MAX_HEIGHT + 18;
            const countY = y - 6;

            return (
              <React.Fragment key={label + index}>
                {/* Bar */}
                <Rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  rx={4}
                  fill="#1d4ed8"
                  opacity={count === 0 ? 0.15 : 1}
                />
                {/* Count above bar */}
                {count > 0 && (
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={countY}
                    fontSize={11}
                    fill="#1d4ed8"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {count}
                  </SvgText>
                )}
                {/* Month label below bar */}
                <SvgText
                  x={x + BAR_WIDTH / 2}
                  y={labelY}
                  fontSize={11}
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}

interface PRRowProps {
  record: PersonalRecord;
  isLast: boolean;
}

function PRRow({ record, isLast }: PRRowProps) {
  return (
    <View style={[styles.prRow, !isLast && styles.prRowBorder]}>
      <Text style={styles.prExercise} numberOfLines={1}>
        {record.exercise.name}
      </Text>
      <Text style={styles.prValue}>
        {record.value} {record.unit}
      </Text>
      <Text style={styles.prDate}>{formatDate(record.achieved_at)}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { accessToken } = useAuthStore();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [volume, setVolume] = useState<VolumeWeeklyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadProgressPdf = useCallback(async () => {
    if (!accessToken || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const url = memberApi.getProgressPdfUrl();
      const filename = `progreso-${new Date().toISOString().slice(0, 7)}.pdf`;
      const target = `${FileSystem.cacheDirectory}${filename}`;
      const result = await FileSystem.downloadAsync(url, target, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (result.status !== 200) {
        Alert.alert('Error', `No se pudo generar el PDF (status ${result.status})`);
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Tu reporte mensual',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Listo', `PDF guardado en ${result.uri}`);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo descargar el PDF');
    } finally {
      setDownloadingPdf(false);
    }
  }, [accessToken, downloadingPdf]);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!accessToken) return;
      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        // Resolve member id
        let id = memberId;
        if (!id) {
          const me = await memberApi.getMe(accessToken);
          id = me.id;
          setMemberId(id);
        }

        const [sessionsRes, recordsRes, volumeRes] = await Promise.all([
          apiClient.get(`/api/v1/members/${id}/workout-sessions?limit=100`, accessToken),
          apiClient.get(`/api/v1/members/${id}/personal-records`, accessToken),
          memberApi.getMyVolumeWeekly(accessToken, 8).catch(() => null),
        ]);

        setSessions((sessionsRes as { data: SessionSummary[] }).data ?? []);
        setRecords(recordsRes as PersonalRecord[]);
        setVolume(volumeRes);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error cargando datos';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, memberId],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // Derived data
  const last6Months = useMemo(() => getLast6Months(), []);
  const monthlyCounts = useMemo(
    () => countSessionsPerMonth(sessions, last6Months),
    [sessions, last6Months],
  );
  const totalSessions = sessions.length;
  const thisMonthCount = useMemo(() => computeCurrentMonthCount(sessions), [sessions]);
  const bestStreak = useMemo(() => computeLongestStreak(sessions), [sessions]);
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.exercise.name.localeCompare(b.exercise.name, 'es')),
    [records],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Progreso</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1d4ed8']}
            tintColor="#1d4ed8"
          />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total sesiones" value={totalSessions} accent="#1d4ed8" />
          <StatCard label="Este mes" value={thisMonthCount} accent="#16a34a" />
          <StatCard
            label="Mejor racha"
            value={bestStreak === 1 ? `${bestStreak} sem` : `${bestStreak} sem`}
            accent="#d97706"
          />
        </View>

        {/* Volumen semanal */}
        {volume && volume.weekly.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Volumen semanal (kg)</Text>
              {volume.trend_pct !== null && (
                <View
                  style={[
                    styles.trendBadge,
                    {
                      backgroundColor:
                        volume.trend_pct > 0
                          ? '#dcfce7'
                          : volume.trend_pct < 0
                            ? '#fee2e2'
                            : '#f3f4f6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color:
                          volume.trend_pct > 0
                            ? '#15803d'
                            : volume.trend_pct < 0
                              ? '#b91c1c'
                              : '#6b7280',
                      },
                    ]}
                  >
                    {volume.trend_pct > 0 ? '↑' : volume.trend_pct < 0 ? '↓' : '—'}{' '}
                    {Math.abs(volume.trend_pct)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSubtitle}>
              Esta semana:{' '}
              <Text style={styles.bigInline}>{volume.this_week_volume_kg.toLocaleString()} kg</Text>
              {' · '}Promedio 8 semanas: {volume.avg_volume_kg.toLocaleString()} kg
            </Text>
            <VolumeChart weekly={volume.weekly} />
          </View>
        )}

        {/* Top 5 ejercicios por volumen */}
        {volume && volume.top_exercises.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top ejercicios (volumen últimas 8 semanas)</Text>
            {volume.top_exercises.map((ex, idx) => {
              const maxVol = volume.top_exercises[0]?.volume_kg ?? 1;
              const pct = (ex.volume_kg / maxVol) * 100;
              return (
                <View key={ex.id} style={styles.topExRow}>
                  <Text style={styles.topExRank}>#{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.topExHeader}>
                      <Text style={styles.topExName} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <Text style={styles.topExValue}>{ex.volume_kg.toLocaleString()} kg</Text>
                    </View>
                    <View style={styles.topExBarBg}>
                      <View style={[styles.topExBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.topExSets}>{ex.sets} series</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Fotos de progreso CTA */}
        <TouchableOpacity
          style={styles.photosCta}
          onPress={() => router.push('/progress/photos' as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.photosCtaEmoji}>📸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.photosCtaTitle}>Fotos de progreso</Text>
            <Text style={styles.photosCtaSub}>
              Sube tu foto antes / después y compara tu evolución
            </Text>
          </View>
          <Text style={styles.photosCtaChevron}>›</Text>
        </TouchableOpacity>

        {/* PDF mensual CTA */}
        <TouchableOpacity
          style={[styles.photosCta, { backgroundColor: '#eef2ff' }]}
          onPress={downloadProgressPdf}
          disabled={downloadingPdf}
          activeOpacity={0.85}
        >
          <Text style={styles.photosCtaEmoji}>{downloadingPdf ? '⏳' : '📄'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.photosCtaTitle}>
              {downloadingPdf ? 'Generando PDF…' : 'Reporte mensual PDF'}
            </Text>
            <Text style={styles.photosCtaSub}>
              {downloadingPdf
                ? 'Esto puede tardar unos segundos'
                : 'Descarga y comparte tu progreso del mes'}
            </Text>
          </View>
          {!downloadingPdf && <Text style={styles.photosCtaChevron}>↓</Text>}
        </TouchableOpacity>

        {/* Attendance chart */}
        <AttendanceChart counts={monthlyCounts} labels={last6Months.map((m) => m.label)} />

        {/* Personal records */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récords personales 🏆</Text>
          {sortedRecords.length === 0 ? (
            <Text style={styles.emptyText}>
              Aún no tienes récords registrados — ¡empieza a entrenar!
            </Text>
          ) : (
            <>
              {/* Table header */}
              <View style={[styles.prRow, styles.prHeaderRow]}>
                <Text style={[styles.prExercise, styles.prHeaderText]}>Ejercicio</Text>
                <Text style={[styles.prValue, styles.prHeaderText]}>Marca</Text>
                <Text style={[styles.prDate, styles.prHeaderText]}>Fecha</Text>
              </View>
              {sortedRecords.map((record, idx) => (
                <PRRow key={record.id} record={record} isLast={idx === sortedRecords.length - 1} />
              ))}
            </>
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 60,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  bottomPad: {
    height: 40,
  },

  // ─── Sprint C — volumen y top ejercicios ─────────────────────────────────
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  bigInline: { color: '#111827', fontWeight: '800' },
  trendBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  trendText: { fontSize: 12, fontWeight: '700' },

  topExRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  topExRank: { fontSize: 13, fontWeight: '800', color: '#9ca3af', width: 22, textAlign: 'right' },
  topExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  topExName: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  topExValue: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  topExBarBg: {
    height: 5,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  topExBarFill: { height: '100%', backgroundColor: '#1d4ed8', borderRadius: 3 },
  topExSets: { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  photosCta: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#1d4ed8',
  },
  photosCtaEmoji: { fontSize: 30 },
  photosCtaTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  photosCtaSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  photosCtaChevron: { fontSize: 24, color: '#9ca3af' },

  // Error
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  // Empty state
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // PR table
  prHeaderRow: {
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  prHeaderText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  prRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  prExercise: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  prValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
    minWidth: 72,
    textAlign: 'right',
    marginRight: 12,
  },
  prDate: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 76,
    textAlign: 'right',
  },
});
