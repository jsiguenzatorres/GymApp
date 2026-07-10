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
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import {
  memberApi,
  nutritionApi,
  NutritionPlan,
  DiaryDay,
  AddonTier,
  FoodItem,
  TodayMacros,
} from '@/lib/api-client';

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

const TIER_BADGE: Record<AddonTier, { label: string; emoji: string; color: string; bg: string }> = {
  BASIC: { label: 'Básico', emoji: '🥗', color: '#6b7280', bg: '#f3f4f6' },
  PRO: { label: 'NutriPro', emoji: '💪', color: '#15803d', bg: '#dcfce7' },
  ELITE: { label: 'NutriElite', emoji: '🏆', color: '#b45309', bg: '#fef3c7' },
};

const BASIC_DAILY_AI_LIMIT = 0;
const PRO_DAILY_AI_LIMIT = 5;

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

function LockedFeature({
  emoji,
  title,
  desc,
  requiresTier,
  onUpgrade,
}: {
  emoji: string;
  title: string;
  desc: string;
  requiresTier: 'PRO' | 'ELITE';
  onUpgrade: () => void;
}) {
  return (
    <TouchableOpacity style={styles.lockedCard} onPress={onUpgrade} activeOpacity={0.8}>
      <View style={styles.lockedLeft}>
        <Text style={styles.lockedEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.lockedTitle}>
            {title} <Text style={styles.lockIcon}>🔒</Text>
          </Text>
          <Text style={styles.lockedDesc}>{desc}</Text>
        </View>
      </View>
      <View style={styles.lockedBadge}>
        <Text style={styles.lockedBadgeText}>Requiere {requiresTier}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NutritionScreen() {
  const { accessToken } = useAuthStore();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [diary, setDiary] = useState<DiaryDay | null>(null);
  const [todayMacros, setTodayMacros] = useState<TodayMacros | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<AddonTier>('BASIC');
  const [aiInput, setAiInput] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsedToday, setAiUsedToday] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState<null | 'PRO' | 'ELITE'>(null);

  // ─── Estado del modal "Registrar comida" ─────────────────────────────────
  const [logOpen, setLogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityG, setQuantityG] = useState('100');
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('LUNCH');
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);

      const [plansRes, addonsRes] = await Promise.all([
        nutritionApi.getMyPlans(me.id, accessToken).catch(() => []),
        memberApi.getMyAddons(accessToken).catch(() => null),
      ]);

      const active = plansRes?.find((p) => p.is_active) ?? plansRes?.[0] ?? null;
      setPlan(active);
      if (addonsRes) setTier(addonsRes.effective.nutrition_tier);

      if (active) {
        const today = todayString();
        const [d, tm] = await Promise.all([
          nutritionApi.getDiary(me.id, today, accessToken).catch(() => null),
          nutritionApi.getTodayMacros(me.id, accessToken).catch(() => null),
        ]);
        setDiary(d);
        setTodayMacros(tm);
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

  // Búsqueda con debounce — busca alimentos al escribir
  useEffect(() => {
    if (!logOpen || !accessToken) return;
    const q = searchQuery.trim();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const results = await nutritionApi.searchFoodItems(accessToken, q || undefined);
        setSearchResults(results.slice(0, 25));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [searchQuery, logOpen, accessToken]);

  const openLogModal = () => {
    if (tier === 'BASIC') {
      setPaywallOpen('PRO');
      return;
    }
    setSelectedFood(null);
    setQuantityG('100');
    setSearchQuery('');
    setSearchResults([]);
    // Detecta meal_type según hora actual
    const h = new Date().getHours();
    setMealType(h < 11 ? 'BREAKFAST' : h < 16 ? 'LUNCH' : h < 20 ? 'DINNER' : 'SNACK');
    setLogOpen(true);
  };

  const submitLog = async () => {
    if (!accessToken || !memberId || !selectedFood) return;
    const qty = parseFloat(quantityG);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Cantidad inválida', 'Indica una cantidad mayor a 0 gramos.');
      return;
    }
    setLogging(true);
    try {
      await nutritionApi.logFood(accessToken, memberId, {
        food_item_id: selectedFood.id,
        plan_id: plan?.id,
        date: todayString(),
        meal_type: mealType,
        quantity_g: qty,
      });
      setLogOpen(false);
      // refrescar el diario del día
      const d = await nutritionApi.getDiary(memberId, todayString(), accessToken).catch(() => null);
      setDiary(d);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar';
      Alert.alert('Error', msg);
    } finally {
      setLogging(false);
    }
  };

  const dailyAiLimit =
    tier === 'ELITE' ? Infinity : tier === 'PRO' ? PRO_DAILY_AI_LIMIT : BASIC_DAILY_AI_LIMIT;

  const askAi = async () => {
    if (!plan || !memberId || !accessToken || !aiInput.trim()) return;

    if (aiUsedToday >= dailyAiLimit) {
      if (tier === 'BASIC') {
        setPaywallOpen('PRO');
      } else {
        Alert.alert(
          'Límite diario alcanzado',
          tier === 'PRO'
            ? 'Has usado tus 5 consultas de hoy. Mejora a NutriElite para consultas ilimitadas.'
            : 'Alcanzaste el límite.',
        );
      }
      return;
    }

    setAiLoading(true);
    setAiReply('');
    try {
      const res = await nutritionApi.aiSuggest(plan.id, memberId, aiInput.trim(), accessToken);
      setAiReply(res.response);
      setAiUsedToday((n) => n + 1);
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

  // BASIC limita visualmente a las 3 primeras entradas del día — el resto bloqueado
  const visibleEntries =
    tier === 'BASIC' ? (diary?.entries ?? []).slice(0, 3) : (diary?.entries ?? []);
  const hiddenCount = tier === 'BASIC' ? Math.max(0, (diary?.entries.length ?? 0) - 3) : 0;

  const tierConfig = TIER_BADGE[tier];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mi Nutrición</Text>
        <View style={[styles.tierChip, { backgroundColor: tierConfig.bg }]}>
          <Text style={[styles.tierChipText, { color: tierConfig.color }]}>
            {tierConfig.emoji} {tierConfig.label}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.nutritionistBanner}
        onPress={() =>
          router.push({ pathname: '/appointments', params: { presetType: 'NUTRITION' } })
        }
      >
        <Text style={styles.nutritionistBannerText}>
          📅 Agendar seguimiento con tu nutricionista
        </Text>
        <Text style={styles.nutritionistBannerArrow}>→</Text>
      </TouchableOpacity>

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
            <>
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🥗</Text>
                <Text style={styles.emptyTitle}>Sin plan nutricional</Text>
                <Text style={styles.emptySub}>
                  Pídele a tu entrenador o nutricionista que te asigne uno
                </Text>
              </View>
              {tier !== 'ELITE' && (
                <LockedFeature
                  emoji="🤖"
                  title="Genera un plan con IA"
                  desc="Si tu gym aún no te asigna nutri, NutriElite te crea uno personalizado en 1 minuto"
                  requiresTier="ELITE"
                  onUpgrade={() => setPaywallOpen('ELITE')}
                />
              )}
            </>
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
                    <Text style={styles.kcalNum}>
                      {todayMacros?.today?.kcal_target ?? plan.kcal_target}
                    </Text>
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </View>
                </View>
                {todayMacros?.has_plan && (
                  <Text style={styles.nutrientTimingNote}>
                    {todayMacros.is_training_day
                      ? '💪 Hoy entrenaste — carbos +12%'
                      : '😴 Día de descanso — carbos -12%'}
                  </Text>
                )}
                <View style={styles.macros}>
                  {[
                    {
                      label: 'Proteína',
                      value: todayMacros?.today?.protein_g ?? plan.protein_g,
                      unit: 'g',
                      color: '#2563eb',
                      key: 'protein_g' as const,
                    },
                    {
                      label: 'Carbos',
                      value: todayMacros?.today?.carbs_g ?? plan.carbs_g,
                      unit: 'g',
                      color: '#d97706',
                      key: 'carbs_g' as const,
                    },
                    {
                      label: 'Grasas',
                      value: todayMacros?.today?.fat_g ?? plan.fat_g,
                      unit: 'g',
                      color: '#dc2626',
                      key: 'fat_g' as const,
                    },
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
                        value={diary?.totals?.[m.key] ?? 0}
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
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Diario de hoy</Text>
                  {tier !== 'BASIC' && (
                    <TouchableOpacity style={styles.addEntryBtn} onPress={openLogModal}>
                      <Text style={styles.addEntryText}>+ Registrar</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
                  const entries = groupedEntries[meal]?.filter((e) =>
                    visibleEntries.some((v) => v.id === e.id),
                  );
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

                {hiddenCount > 0 && (
                  <TouchableOpacity
                    style={styles.hiddenEntriesCard}
                    onPress={() => setPaywallOpen('PRO')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.hiddenEntriesIcon}>🔒</Text>
                    <Text style={styles.hiddenEntriesText}>
                      Hay {hiddenCount} entrada{hiddenCount === 1 ? '' : 's'} más oculta
                      {hiddenCount === 1 ? '' : 's'}.{' '}
                      <Text style={styles.hiddenEntriesCta}>
                        Desbloquea NutriPro para verlas todas →
                      </Text>
                    </Text>
                  </TouchableOpacity>
                )}

                {!diary?.entries?.length && (
                  <Text style={styles.noEntries}>
                    Sin registros hoy.{' '}
                    {tier === 'BASIC'
                      ? 'Pídele a tu nutricionista que registre tus comidas.'
                      : 'Toca "+ Registrar" para añadir.'}
                  </Text>
                )}
              </View>

              {/* AI Nutritionist */}
              {tier === 'BASIC' ? (
                <LockedFeature
                  emoji="🌿"
                  title="Nutricionista IA"
                  desc="Consulta sobre tu dieta, macros y sustituciones desde tu teléfono"
                  requiresTier="PRO"
                  onUpgrade={() => setPaywallOpen('PRO')}
                />
              ) : (
                <View style={[styles.card, { backgroundColor: '#f0fdf4' }]}>
                  <View style={styles.aiHeaderRow}>
                    <Text style={styles.aiTitle}>🌿 Nutricionista IA</Text>
                    <Text style={styles.aiLimit}>
                      {tier === 'ELITE' ? 'Ilimitado' : `${aiUsedToday}/${PRO_DAILY_AI_LIMIT} hoy`}
                    </Text>
                  </View>
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
                        placeholder="Ej: ¿puedo cambiar el pollo por atún?"
                        style={styles.aiInput}
                        multiline
                        editable={!aiLoading}
                      />
                      <TouchableOpacity
                        style={[styles.aiSendBtn, aiLoading && { opacity: 0.5 }]}
                        onPress={askAi}
                        disabled={aiLoading}
                      >
                        {aiLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.aiSendText}>↑</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* PRO/ELITE features — "Coming soon" para implementar después */}
              {tier === 'BASIC' ? (
                <>
                  <Text style={styles.upgradeSection}>
                    Desbloquea más con NutriPro / NutriElite
                  </Text>
                  <LockedFeature
                    emoji="🔍"
                    title="Búsqueda de alimentos"
                    desc="Base de 20,000+ alimentos USDA + comidas LATAM"
                    requiresTier="PRO"
                    onUpgrade={() => setPaywallOpen('PRO')}
                  />
                  <LockedFeature
                    emoji="📷"
                    title="Escaneo de código de barras"
                    desc="Apunta a un producto, lo identifica y agrega solo"
                    requiresTier="PRO"
                    onUpgrade={() => setPaywallOpen('PRO')}
                  />
                  <LockedFeature
                    emoji="📅"
                    title="Histórico 30 días"
                    desc="Calendario para revisar días anteriores + gráfica calórica"
                    requiresTier="PRO"
                    onUpgrade={() => setPaywallOpen('PRO')}
                  />
                  <LockedFeature
                    emoji="🤖"
                    title="Foto del plato → IA"
                    desc="Toma foto de lo que vas a comer y la IA identifica kcal y macros"
                    requiresTier="ELITE"
                    onUpgrade={() => setPaywallOpen('ELITE')}
                  />
                </>
              ) : tier === 'PRO' ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    ]}
                    onPress={() => router.push('/nutrition-barcode' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>📷</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Escanear código de barras</Text>
                      <Text style={styles.lockedDesc}>
                        Apunta al producto y se registra solo (base mundial OpenFoodFacts)
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#15803d' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    ]}
                    onPress={() => router.push('/nutrition-text-log' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>✏️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Registrar por texto</Text>
                      <Text style={styles.lockedDesc}>
                        Escribe "comí 200g pollo" y la IA lo registra al diario
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#15803d' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.unlockedFeatureCard}
                    onPress={() => router.push('/nutrition-history' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>📅</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Histórico 30 días</Text>
                      <Text style={styles.lockedDesc}>
                        Calendario navegable + gráfica calórica de tus últimos 30 días
                      </Text>
                    </View>
                    <Text style={styles.unlockedChevron}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    ]}
                    onPress={() => router.push('/nutrition-shopping' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>🛒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Lista de compras semanal</Text>
                      <Text style={styles.lockedDesc}>
                        Generada por IA según tu plan, con checkboxes
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#15803d' }]}>›</Text>
                  </TouchableOpacity>
                  <LockedFeature
                    emoji="🤖"
                    title="Foto del plato → IA"
                    desc="La feature killer: foto y listo. Solo en NutriElite."
                    requiresTier="ELITE"
                    onUpgrade={() => setPaywallOpen('ELITE')}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.unlockedFeatureCard}
                    onPress={() => router.push('/nutrition-history' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>📅</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Histórico 30 días</Text>
                      <Text style={styles.lockedDesc}>
                        Calendario navegable + gráfica calórica de tus últimos 30 días
                      </Text>
                    </View>
                    <Text style={styles.unlockedChevron}>›</Text>
                  </TouchableOpacity>
                  <Text style={styles.eliteHeader}>🏆 Funciones NutriElite</Text>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                    ]}
                    onPress={() => router.push('/nutrition-photo' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>📷</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Foto del plato → IA</Text>
                      <Text style={styles.lockedDesc}>
                        Toma foto, identifica alimentos y registra al diario sin teclear
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#b45309' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#ede9fe', borderColor: '#c4b5fd' },
                    ]}
                    onPress={() => router.push('/nutrition-adaptive' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>🧬</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Análisis adaptativo IA</Text>
                      <Text style={styles.lockedDesc}>
                        La IA revisa tu progreso real y sugiere ajustes al plan
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#7c3aed' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                    ]}
                    onPress={() => router.push('/nutrition-recipes' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>👨‍🍳</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Recetas IA</Text>
                      <Text style={styles.lockedDesc}>
                        Dime qué ingredientes tienes y te genero la receta + macros
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#b45309' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    ]}
                    onPress={() => router.push('/nutrition-shopping' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>🛒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Lista de compras semanal</Text>
                      <Text style={styles.lockedDesc}>
                        Generada por IA basada en tu plan, categorizada y checkable
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#15803d' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    ]}
                    onPress={() => router.push('/nutrition-barcode' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>📷</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Escanear código de barras</Text>
                      <Text style={styles.lockedDesc}>
                        Apunta al producto y se registra solo (OpenFoodFacts)
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#15803d' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    ]}
                    onPress={() => router.push('/nutrition-text-log' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>✏️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Registrar por texto (estilo WhatsApp)</Text>
                      <Text style={styles.lockedDesc}>
                        Escribe "comí 200g pollo" y la IA lo registra al diario
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#15803d' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
                    ]}
                    onPress={() => router.push('/health-data' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>❤️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Datos de salud</Text>
                      <Text style={styles.lockedDesc}>
                        Peso, agua, sueño y pasos (sync nativo Apple Health en breve)
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#dc2626' }]}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unlockedFeatureCard,
                      { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
                    ]}
                    onPress={() => router.push('/monthly-box' as never)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lockedEmoji}>📦</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedTitle}>Caja del mes incluida</Text>
                      <Text style={styles.lockedDesc}>
                        Recibe la caja premium de tu gym (exclusivo NutriElite)
                      </Text>
                    </View>
                    <Text style={[styles.unlockedChevron, { color: '#b45309' }]}>›</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal "Registrar comida" */}
      <Modal
        visible={logOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLogOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.logModalCard}>
            <View style={styles.logModalHeader}>
              <Text style={styles.logModalTitle}>Registrar comida</Text>
              <TouchableOpacity onPress={() => setLogOpen(false)}>
                <Text style={styles.logModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {!selectedFood ? (
              <>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar alimento (ej: pupusa, pollo, arroz)…"
                  style={styles.logSearchInput}
                  autoFocus
                  autoCorrect={false}
                />
                {searching && <ActivityIndicator color="#15803d" style={{ marginTop: 8 }} />}
                <ScrollView style={styles.logResults} keyboardShouldPersistTaps="handled">
                  {searchResults.length === 0 && !searching && (
                    <Text style={styles.logEmpty}>
                      {searchQuery
                        ? 'Sin resultados. Intenta otro término.'
                        : 'Empieza a escribir para buscar.'}
                    </Text>
                  )}
                  {searchResults.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={styles.logResultRow}
                      onPress={() => setSelectedFood(f)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logResultName} numberOfLines={1}>
                          {f.name}
                          {f.brand && <Text style={styles.logResultBrand}> · {f.brand}</Text>}
                        </Text>
                        <Text style={styles.logResultMacro}>
                          {Math.round(f.kcal_per_100g)} kcal · P{f.protein_per_100g.toFixed(1)} · C
                          {f.carbs_per_100g.toFixed(1)} · G{f.fat_per_100g.toFixed(1)} (por 100g)
                        </Text>
                      </View>
                      <Text style={styles.logResultArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.logSelectedCard}>
                  <Text style={styles.logSelectedName}>{selectedFood.name}</Text>
                  {selectedFood.brand && (
                    <Text style={styles.logResultBrand}>{selectedFood.brand}</Text>
                  )}
                  <Text style={styles.logSelectedMacro}>
                    Por 100g: {Math.round(selectedFood.kcal_per_100g)} kcal · P
                    {selectedFood.protein_per_100g.toFixed(1)} · C
                    {selectedFood.carbs_per_100g.toFixed(1)} · G
                    {selectedFood.fat_per_100g.toFixed(1)}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedFood(null)} style={{ marginTop: 6 }}>
                    <Text style={styles.logChangeFood}>‹ Cambiar alimento</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.logFieldLabel}>Cantidad (g)</Text>
                <TextInput
                  value={quantityG}
                  onChangeText={setQuantityG}
                  keyboardType="numeric"
                  style={styles.logQuantityInput}
                />

                {(() => {
                  const qty = parseFloat(quantityG) || 0;
                  const factor = qty / 100;
                  return (
                    <View style={styles.logPreview}>
                      <Text style={styles.logPreviewText}>
                        Esta porción aporta:{' '}
                        <Text style={styles.logPreviewBig}>
                          {Math.round(selectedFood.kcal_per_100g * factor)} kcal
                        </Text>
                        {'\n'}P{(selectedFood.protein_per_100g * factor).toFixed(1)}g · C
                        {(selectedFood.carbs_per_100g * factor).toFixed(1)}g · G
                        {(selectedFood.fat_per_100g * factor).toFixed(1)}g
                      </Text>
                    </View>
                  );
                })()}

                <Text style={styles.logFieldLabel}>Comida</Text>
                <View style={styles.mealPicker}>
                  {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealPickerBtn, mealType === m && styles.mealPickerBtnActive]}
                      onPress={() => setMealType(m)}
                    >
                      <Text
                        style={[
                          styles.mealPickerText,
                          mealType === m && styles.mealPickerTextActive,
                        ]}
                      >
                        {MEAL_LABEL[m]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.logSubmitBtn, logging && { opacity: 0.5 }]}
                  onPress={submitLog}
                  disabled={logging}
                >
                  {logging ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.logSubmitText}>Registrar comida</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Paywall modal */}
      <Modal
        visible={paywallOpen !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPaywallOpen(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {paywallOpen === 'PRO' ? (
              <>
                <Text style={styles.modalEmoji}>💪</Text>
                <Text style={styles.modalTitle}>NutriPro</Text>
                <Text style={styles.modalPrice}>
                  $15<Text style={styles.modalPriceUnit}>/mes</Text>
                </Text>
                <View style={{ alignSelf: 'stretch', marginTop: 12, gap: 8 }}>
                  {[
                    'Diario ilimitado + edición',
                    'Búsqueda de 20,000+ alimentos',
                    'Escaneo código de barras',
                    'Histórico de 30 días + gráfica',
                    'Nutricionista IA: 5 consultas/día',
                    'Plan recomendado IA',
                    'Recordatorios inteligentes',
                  ].map((f) => (
                    <Text key={f} style={styles.modalFeature}>
                      ✓ {f}
                    </Text>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalEmoji}>🏆</Text>
                <Text style={styles.modalTitle}>NutriElite</Text>
                <Text style={styles.modalPrice}>
                  $30<Text style={styles.modalPriceUnit}>/mes</Text>
                </Text>
                <View style={{ alignSelf: 'stretch', marginTop: 12, gap: 8 }}>
                  {[
                    'Todo lo de NutriPro',
                    'Foto del plato → IA identifica kcal',
                    'Plan adaptativo semanal por IA',
                    'Recetas IA con tus ingredientes',
                    'Nutricionista IA ilimitado',
                    'Bot WhatsApp para registrar comidas',
                    'Apple Health / Google Fit',
                    'Caja semanal del gym incluida',
                  ].map((f) => (
                    <Text key={f} style={styles.modalFeature}>
                      ✓ {f}
                    </Text>
                  ))}
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.modalCta}
              onPress={() => {
                setPaywallOpen(null);
                Alert.alert(
                  'Contacta a tu gym',
                  'Pídele a tu gym que active esta suscripción para ti. El precio puede variar según tu gym.',
                );
              }}
            >
              <Text style={styles.modalCtaText}>Hablar con mi gym</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaywallOpen(null)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 14, color: '#1d4ed8', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  tierChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tierChipText: { fontSize: 11, fontWeight: '700' },
  nutritionistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  nutritionistBannerText: { fontSize: 13, fontWeight: '600', color: '#1d4ed8', flex: 1 },
  nutritionistBannerArrow: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 24 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  planGoal: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  planName: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 2 },
  nutrientTimingNote: { fontSize: 11, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  kcalBadge: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  kcalNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  kcalUnit: { color: '#dbeafe', fontSize: 10, fontWeight: '600' },
  macros: { gap: 12 },
  macroItem: {},
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  macroValue: { fontSize: 13, fontWeight: '700' },
  macroBarTrack: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: 6, borderRadius: 3 },
  planNotes: { marginTop: 12, fontSize: 13, color: '#374151', lineHeight: 19 },

  section: { gap: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  addEntryBtn: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  addEntryText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  totalRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  totalLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  totalValue: { fontSize: 12, color: '#111827', fontWeight: '600' },
  mealGroup: { backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 4 },
  mealTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  diaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  diaryLeft: { flex: 1 },
  diaryFood: { fontSize: 13, color: '#111827', fontWeight: '600' },
  diarySub: { fontSize: 11, color: '#9ca3af' },
  diaryRight: { alignItems: 'flex-end' },
  diaryQty: { fontSize: 12, color: '#6b7280' },
  diaryKcal: { fontSize: 13, color: '#1d4ed8', fontWeight: '700' },
  noEntries: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },

  hiddenEntriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  hiddenEntriesIcon: { fontSize: 18 },
  hiddenEntriesText: { flex: 1, fontSize: 12, color: '#78350f' },
  hiddenEntriesCta: { fontWeight: '700', color: '#b45309' },

  aiHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiTitle: { fontSize: 15, fontWeight: '700', color: '#15803d' },
  aiLimit: { fontSize: 11, color: '#15803d', fontWeight: '600' },
  aiSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 10 },
  aiInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  aiInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  aiSendBtn: {
    backgroundColor: '#15803d',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  aiReply: { gap: 10 },
  aiReplyText: { fontSize: 13, color: '#111827', lineHeight: 19 },
  newQueryBtn: {
    backgroundColor: '#15803d',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  newQueryText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Locked / Coming soon
  lockedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  lockedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  lockedEmoji: { fontSize: 24 },
  lockedTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  lockedDesc: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  lockIcon: { fontSize: 12 },
  lockedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  lockedBadgeText: { color: '#b45309', fontSize: 10, fontWeight: '700' },
  unlockedFeatureCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  unlockedChevron: { fontSize: 22, color: '#15803d', fontWeight: '700' },

  soonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 0.85,
  },
  soonEmoji: { fontSize: 24 },
  soonTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  soonDesc: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  soonBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  soonBadgeText: { color: '#1d4ed8', fontSize: 10, fontWeight: '700' },

  upgradeSection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  eliteHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
    marginTop: 8,
    paddingHorizontal: 4,
  },

  // Modal paywall
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  modalEmoji: { fontSize: 48 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 4 },
  modalPrice: { fontSize: 36, fontWeight: '900', color: '#1d4ed8', marginTop: 4 },
  modalPriceUnit: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  modalFeature: { fontSize: 13, color: '#374151' },
  modalCta: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 100,
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalCtaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  modalClose: { marginTop: 8, padding: 8 },
  modalCloseText: { color: '#9ca3af', fontSize: 13 },

  // ─── Modal "Registrar comida" ──────────────────────────────────────────────
  logModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  logModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  logModalClose: { fontSize: 22, color: '#9ca3af', paddingHorizontal: 8 },
  logSearchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  logResults: { marginTop: 8, maxHeight: 360 },
  logEmpty: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  logResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  logResultName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  logResultBrand: { fontSize: 12, color: '#9ca3af', fontWeight: '400' },
  logResultMacro: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  logResultArrow: { fontSize: 18, color: '#9ca3af' },

  logSelectedCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  logSelectedName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  logSelectedMacro: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  logChangeFood: { fontSize: 12, color: '#15803d', fontWeight: '600' },

  logFieldLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  logQuantityInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },

  logPreview: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  logPreviewText: { fontSize: 12, color: '#78350f', lineHeight: 18 },
  logPreviewBig: { fontSize: 14, fontWeight: '800', color: '#b45309' },

  mealPicker: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  mealPickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#f3f4f6',
  },
  mealPickerBtnActive: { backgroundColor: '#15803d' },
  mealPickerText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  mealPickerTextActive: { color: '#fff', fontWeight: '700' },

  logSubmitBtn: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logSubmitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
