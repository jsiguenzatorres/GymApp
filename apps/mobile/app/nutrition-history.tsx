import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, nutritionApi, NutritionPlan, DiaryRange, DiaryDay } from '@/lib/api-client';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  LUNCH: 'Almuerzo',
  DINNER: 'Cena',
  SNACK: 'Merienda',
};

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

function shortDay(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' });
}

export default function NutritionHistoryScreen() {
  const { accessToken } = useAuthStore();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [range, setRange] = useState<DiaryRange | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayDiary, setSelectedDayDiary] = useState<DiaryDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);
      const [plansRes, rangeRes] = await Promise.all([
        nutritionApi.getMyPlans(me.id, accessToken).catch(() => []),
        nutritionApi.getDiaryRange(me.id, accessToken, 30).catch(() => null),
      ]);
      setPlan(plansRes?.find((p) => p.is_active) ?? plansRes?.[0] ?? null);
      setRange(rangeRes);
      // Auto-seleccionar el último día con logs (o hoy)
      const lastWithLogs = [...(rangeRes?.daily ?? [])].reverse().find((d) => d.entries > 0);
      const initialDate = lastWithLogs?.date ?? rangeRes?.daily?.at(-1)?.date ?? null;
      setSelectedDate(initialDate);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Cuando cambia el día seleccionado, traer su diario detallado
  useEffect(() => {
    if (!accessToken || !memberId || !selectedDate) return;
    setLoadingDay(true);
    nutritionApi
      .getDiary(memberId, selectedDate, accessToken)
      .then(setSelectedDayDiary)
      .catch(() => setSelectedDayDiary(null))
      .finally(() => setLoadingDay(false));
  }, [accessToken, memberId, selectedDate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  const target = plan?.kcal_target ?? 0;
  const days = range?.daily ?? [];
  const maxKcal = Math.max(target, ...days.map((d) => d.kcal), 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico nutricional</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumen 30 días */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryValue}>{range?.days_with_logs ?? 0}</Text>
            <Text style={styles.summaryLabel}>Días con registro</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryValue}>{range?.avg_kcal ?? 0}</Text>
            <Text style={styles.summaryLabel}>kcal promedio</Text>
          </View>
          {target > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValue}>{target}</Text>
                <Text style={styles.summaryLabel}>Target diario</Text>
              </View>
            </>
          )}
        </View>

        {/* Gráfica de barras 30 días */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Calorías últimos 30 días</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <Svg width={days.length * 12 + 16} height={170}>
              {/* Línea target */}
              {target > 0 && (
                <>
                  <Line
                    x1={8}
                    y1={150 - (target / maxKcal) * 130}
                    x2={days.length * 12 + 8}
                    y2={150 - (target / maxKcal) * 130}
                    stroke="#dc2626"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <SvgText
                    x={days.length * 12 + 6}
                    y={150 - (target / maxKcal) * 130 - 4}
                    fontSize="9"
                    fill="#dc2626"
                    fontWeight="700"
                    textAnchor="end"
                  >
                    target
                  </SvgText>
                </>
              )}
              {days.map((d, i) => {
                const h = d.kcal === 0 ? 2 : (d.kcal / maxKcal) * 130;
                const x = 8 + i * 12;
                const y = 150 - h;
                const isSel = d.date === selectedDate;
                return (
                  <Rect
                    key={d.date}
                    x={x}
                    y={y}
                    width={8}
                    height={h}
                    rx={2}
                    fill={isSel ? '#1d4ed8' : d.kcal === 0 ? '#e5e7eb' : '#93c5fd'}
                  />
                );
              })}
              {/* Labels de eje cada 5 días */}
              {days.map((d, i) =>
                i % 5 === 0 ? (
                  <SvgText
                    key={`l-${d.date}`}
                    x={8 + i * 12 + 4}
                    y={165}
                    fontSize="8"
                    fill="#9ca3af"
                    textAnchor="middle"
                  >
                    {shortDay(d.date).split(' ')[0]}
                  </SvgText>
                ) : null,
              )}
            </Svg>
          </ScrollView>
          <Text style={styles.chartHint}>
            Línea roja: tu target diario. Toca una barra abajo para ver el detalle del día.
          </Text>
        </View>

        {/* Lista navegable de días (chips horizontales) */}
        <View style={styles.daysCard}>
          <Text style={styles.cardTitle}>Selecciona un día</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[...days].reverse().map((d) => {
                const isSel = d.date === selectedDate;
                const hasEntries = d.entries > 0;
                return (
                  <TouchableOpacity
                    key={d.date}
                    style={[
                      styles.dayChip,
                      isSel && styles.dayChipActive,
                      !hasEntries && !isSel && styles.dayChipEmpty,
                    ]}
                    onPress={() => setSelectedDate(d.date)}
                  >
                    <Text style={[styles.dayChipText, isSel && styles.dayChipTextActive]}>
                      {shortDay(d.date)}
                    </Text>
                    <Text
                      style={[
                        styles.dayChipKcal,
                        isSel && styles.dayChipKcalActive,
                        !hasEntries && styles.dayChipEmptyText,
                      ]}
                    >
                      {hasEntries ? `${d.kcal} kcal` : 'sin datos'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Detalle del día seleccionado */}
        {selectedDate && (
          <View style={styles.dayDetailCard}>
            <Text style={styles.cardTitle}>{formatDate(selectedDate)}</Text>
            {loadingDay ? (
              <ActivityIndicator color="#1d4ed8" style={{ marginTop: 12 }} />
            ) : selectedDayDiary && selectedDayDiary.entries.length > 0 ? (
              <>
                <View style={styles.dayTotalsRow}>
                  <Text style={styles.dayTotalsText}>
                    {Math.round(selectedDayDiary.totals.kcal)} kcal
                  </Text>
                  <Text style={styles.dayTotalsSub}>
                    P{Math.round(selectedDayDiary.totals.protein_g)}g · C
                    {Math.round(selectedDayDiary.totals.carbs_g)}g · G
                    {Math.round(selectedDayDiary.totals.fat_g)}g
                  </Text>
                </View>
                {selectedDayDiary.entries.map((e) => (
                  <View key={e.id} style={styles.dayEntryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayEntryName} numberOfLines={1}>
                        {e.food_item.name}
                      </Text>
                      <Text style={styles.dayEntryMeal}>
                        {MEAL_LABEL[e.meal_type] ?? e.meal_type} · {e.quantity_g}g
                      </Text>
                    </View>
                    <Text style={styles.dayEntryKcal}>{Math.round(e.kcal)} kcal</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.empty}>Sin registros este día.</Text>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  scroll: { padding: 16, gap: 14 },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCol: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#1d4ed8' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#f3f4f6' },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  chartHint: { fontSize: 10, color: '#9ca3af', marginTop: 4 },

  daysCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dayChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 64,
  },
  dayChipActive: { backgroundColor: '#1d4ed8' },
  dayChipEmpty: { opacity: 0.45 },
  dayChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  dayChipTextActive: { color: '#fff' },
  dayChipKcal: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  dayChipKcalActive: { color: '#dbeafe' },
  dayChipEmptyText: { color: '#9ca3af' },

  dayDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dayTotalsRow: {
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayTotalsText: { fontSize: 22, fontWeight: '800', color: '#1d4ed8' },
  dayTotalsSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  dayEntryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    alignItems: 'center',
  },
  dayEntryName: { fontSize: 14, color: '#111827', fontWeight: '600' },
  dayEntryMeal: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  dayEntryKcal: { fontSize: 14, color: '#1d4ed8', fontWeight: '700' },
  empty: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
});
