import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, nutritionApi, NutritionPlan, DiaryDay } from '@/lib/api-client';

const GOAL_LABEL: Record<string, string> = {
  WEIGHT_LOSS: '🔥 Pérdida de peso',
  MUSCLE_GAIN: '💪 Ganancia muscular',
  MAINTENANCE: '⚖️ Mantenimiento',
  PERFORMANCE: '⚡ Rendimiento',
};

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  LUNCH: 'Almuerzo',
  DINNER: 'Cena',
  SNACK: 'Merienda',
};

const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function MacroBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <View style={styles.macroBarTrack}>
      <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function NutritionScreen() {
  const { accessToken } = useAuthStore();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [diary, setDiary] = useState<DiaryDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);
      const plans = await nutritionApi.getMyPlans(me.id, accessToken);
      const active = plans?.find((p) => p.is_active) ?? plans?.[0] ?? null;
      setPlan(active);
      if (active) {
        const today = todayString();
        const d = await nutritionApi.getDiary(me.id, today, accessToken);
        setDiary(d);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const askAi = async () => {
    if (!plan || !memberId || !accessToken || !aiInput.trim()) return;
    setAiLoading(true);
    setAiReply('');
    try {
      const res = await nutritionApi.aiSuggest(plan.id, memberId, aiInput.trim(), accessToken);
      setAiReply(res.suggestion);
    } catch {
      setAiReply('Error al conectar con el Nutricionista IA. Intenta de nuevo.');
    } finally {
      setAiLoading(false);
    }
  };

  const groupedEntries =
    diary?.entries.reduce<Record<string, typeof diary.entries>>((acc, e) => {
      if (!acc[e.meal_type]) acc[e.meal_type] = [];
      acc[e.meal_type].push(e);
      return acc;
    }, {}) ?? {};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mi Nutrición</Text>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 60 }} />
          ) : !plan ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🥗</Text>
              <Text style={styles.emptyTitle}>Sin plan nutricional</Text>
              <Text style={styles.emptySub}>
                Pídele a tu entrenador o nutricionista que te asigne un plan
              </Text>
            </View>
          ) : (
            <>
              {/* Plan card */}
              <View style={styles.card}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planGoal}>{GOAL_LABEL[plan.goal] ?? plan.goal}</Text>
                    <Text style={styles.planName}>{plan.name}</Text>
                  </View>
                  <View style={styles.kcalBadge}>
                    <Text style={styles.kcalNum}>{plan.kcal_target}</Text>
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </View>
                </View>

                {/* Macros */}
                <View style={styles.macros}>
                  {[
                    { label: 'Proteína', value: plan.protein_g, unit: 'g', color: '#2563eb' },
                    { label: 'Carbos', value: plan.carbs_g, unit: 'g', color: '#d97706' },
                    { label: 'Grasas', value: plan.fat_g, unit: 'g', color: '#dc2626' },
                  ].map((m) => (
                    <View key={m.label} style={styles.macroItem}>
                      <View style={styles.macroRow}>
                        <Text style={styles.macroLabel}>{m.label}</Text>
                        <Text style={[styles.macroValue, { color: m.color }]}>
                          {m.value}
                          {m.unit}
                        </Text>
                      </View>
                      <MacroBar
                        value={
                          diary?.totals?.[
                            m.label === 'Proteína'
                              ? 'protein_g'
                              : m.label === 'Carbos'
                                ? 'carbs_g'
                                : 'fat_g'
                          ] ?? 0
                        }
                        target={m.value}
                        color={m.color}
                      />
                    </View>
                  ))}
                </View>

                {plan.notes && <Text style={styles.planNotes}>📝 {plan.notes}</Text>}
              </View>

              {/* Today's diary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Diario de hoy</Text>
                {diary && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Consumido:</Text>
                    <Text style={styles.totalValue}>
                      {Math.round(diary.totals.kcal)} kcal · P:{Math.round(diary.totals.protein_g)}g
                      · C:{Math.round(diary.totals.carbs_g)}g · G:{Math.round(diary.totals.fat_g)}g
                    </Text>
                  </View>
                )}

                {MEAL_ORDER.map((meal) => {
                  const entries = groupedEntries[meal];
                  if (!entries?.length) return null;
                  return (
                    <View key={meal} style={styles.mealGroup}>
                      <Text style={styles.mealTitle}>{MEAL_LABEL[meal] ?? meal}</Text>
                      {entries.map((e) => (
                        <View key={e.id} style={styles.diaryRow}>
                          <View style={styles.diaryLeft}>
                            <Text style={styles.diaryFood}>{e.food_item.name}</Text>
                            {e.food_item.brand && (
                              <Text style={styles.diarySub}>{e.food_item.brand}</Text>
                            )}
                          </View>
                          <View style={styles.diaryRight}>
                            <Text style={styles.diaryQty}>{e.quantity_g}g</Text>
                            <Text style={styles.diaryKcal}>{Math.round(e.kcal)} kcal</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}

                {!diary?.entries?.length && (
                  <Text style={styles.noEntries}>
                    Sin registros hoy. Pídele a tu nutricionista que registre tus comidas.
                  </Text>
                )}
              </View>

              {/* AI Nutritionist */}
              <View style={[styles.card, { backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.aiTitle}>🌿 Nutricionista IA</Text>
                <Text style={styles.aiSubtitle}>
                  Consulta sobre tu dieta, macros o sustituciones
                </Text>

                {aiReply ? (
                  <View style={styles.aiReply}>
                    <Text style={styles.aiReplyText}>{aiReply}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setAiReply('');
                        setAiInput('');
                      }}
                      style={styles.newQueryBtn}
                    >
                      <Text style={styles.newQueryText}>Nueva consulta</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.aiInputRow}>
                    <TextInput
                      value={aiInput}
                      onChangeText={setAiInput}
                      placeholder="¿Qué puedo comer en el desayuno?"
                      placeholderTextColor="#9ca3af"
                      style={styles.aiInput}
                      multiline
                      editable={!aiLoading}
                    />
                    <TouchableOpacity
                      onPress={askAi}
                      disabled={!aiInput.trim() || aiLoading}
                      style={[styles.aiSendBtn, (!aiInput.trim() || aiLoading) && { opacity: 0.4 }]}
                    >
                      {aiLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.aiSendText}>↑</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Quick prompts */}
                {!aiReply && !aiLoading && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 8 }}
                  >
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        '¿Cuántas calorías me faltan?',
                        '¿Qué merendar hoy?',
                        'Sustituye la proteína de hoy',
                      ].map((q) => (
                        <TouchableOpacity
                          key={q}
                          onPress={() => setAiInput(q)}
                          style={styles.quickChip}
                        >
                          <Text style={styles.quickChipText}>{q}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  backText: { color: '#1d4ed8', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planGoal: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  planName: { fontSize: 17, fontWeight: '700', color: '#111827', maxWidth: 220 },
  kcalBadge: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 10,
    minWidth: 64,
  },
  kcalNum: { fontSize: 20, fontWeight: '800', color: '#1d4ed8' },
  kcalUnit: { fontSize: 11, color: '#6b7280' },
  macros: { gap: 8 },
  macroItem: { gap: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { fontSize: 12, color: '#6b7280' },
  macroValue: { fontSize: 12, fontWeight: '700' },
  macroBarTrack: { height: 5, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  planNotes: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  totalRow: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 2 },
  totalLabel: { fontSize: 12, color: '#9ca3af' },
  totalValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  mealGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  mealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  diaryLeft: { flex: 1 },
  diaryFood: { fontSize: 14, color: '#374151' },
  diarySub: { fontSize: 12, color: '#9ca3af' },
  diaryRight: { alignItems: 'flex-end', gap: 1 },
  diaryQty: { fontSize: 12, color: '#9ca3af' },
  diaryKcal: { fontSize: 13, fontWeight: '600', color: '#374151' },
  noEntries: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  aiTitle: { fontSize: 15, fontWeight: '700', color: '#15803d' },
  aiSubtitle: { fontSize: 12, color: '#6b7280', marginTop: -4 },
  aiReply: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 10 },
  aiReplyText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  newQueryBtn: { alignSelf: 'flex-start' },
  newQueryText: { fontSize: 13, color: '#1d4ed8', fontWeight: '600' },
  aiInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  aiInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  aiSendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#16a34a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  quickChip: {
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickChipText: { fontSize: 12, color: '#15803d' },
});
