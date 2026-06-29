import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, nutritionApi, AdaptiveAnalysisResponse } from '@/lib/api-client';

const VERDICT_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  on_track: { emoji: '✅', label: 'Vas en buen camino', color: '#15803d', bg: '#dcfce7' },
  needs_adjustment: { emoji: '⚠️', label: 'Necesita ajustes', color: '#b45309', bg: '#fef3c7' },
  needs_complete_review: {
    emoji: '🔴',
    label: 'Revisión completa',
    color: '#dc2626',
    bg: '#fee2e2',
  },
};

export default function NutritionAdaptiveScreen() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<AdaptiveAnalysisResponse | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const analyze = async () => {
    if (!accessToken) return;
    setLoading(true);
    setData(null);
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);
      const res = await nutritionApi.adaptiveAnalysis(accessToken, me.id);
      setData(res);
      if (!res.success) {
        Alert.alert('Aviso', res.error ?? 'No se pudo generar el análisis');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const applyAdjust = async () => {
    if (!accessToken || !data?.analysis || !memberId) return;
    const { target_kcal_delta, target_protein_g_delta } = data.analysis.adjustments;
    Alert.alert(
      'Aplicar ajuste',
      `Tu meta calórica pasará de ${data.current_targets!.kcal} a ${data.current_targets!.kcal + target_kcal_delta} kcal.\nProteína: ${data.current_targets!.protein_g} → ${data.current_targets!.protein_g + target_protein_g_delta}g`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: async () => {
            setApplying(true);
            try {
              await nutritionApi.adaptiveApply(accessToken, {
                memberId,
                target_kcal_delta,
                target_protein_g_delta,
              });
              Alert.alert('Listo', 'Plan actualizado con éxito');
              setData(null);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo aplicar');
            } finally {
              setApplying(false);
            }
          },
        },
      ],
    );
  };

  const verdictMeta = data?.analysis ? VERDICT_META[data.analysis.verdict] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧬 Análisis adaptativo IA</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!data && !loading && (
          <View style={styles.intro}>
            <Text style={styles.introEmoji}>🧬</Text>
            <Text style={styles.introTitle}>Tu plan adaptativo</Text>
            <Text style={styles.introDesc}>
              Nuestra IA analiza tu progreso real (peso, sesiones, adherencia) de las últimas 4
              semanas y te dice si el plan necesita ajuste. Es un análisis honesto basado en
              evidencia, no en suposiciones.
            </Text>
            <View style={styles.checklistBox}>
              <Text style={styles.checklistTitle}>
                Para mejores resultados, asegúrate de tener:
              </Text>
              <Text style={styles.checklistItem}>✓ Plan nutricional activo</Text>
              <Text style={styles.checklistItem}>
                ✓ Al menos 2 registros de peso (separados por días)
              </Text>
              <Text style={styles.checklistItem}>✓ Registros nutricionales recurrentes</Text>
            </View>
            <TouchableOpacity style={styles.analyzeBtn} onPress={analyze}>
              <Text style={styles.analyzeBtnText}>✨ Analizar mi progreso</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>La IA está revisando tu progreso…</Text>
            <Text style={styles.loadingSubtext}>Esto puede tomar unos segundos</Text>
          </View>
        )}

        {data?.success && data.analysis && verdictMeta && (
          <>
            {/* Veredicto */}
            <View style={[styles.verdictCard, { backgroundColor: verdictMeta.bg }]}>
              <Text style={styles.verdictEmoji}>{verdictMeta.emoji}</Text>
              <Text style={[styles.verdictLabel, { color: verdictMeta.color }]}>
                {verdictMeta.label}
              </Text>
              <Text style={styles.verdictHeadline}>{data.analysis.headline}</Text>
            </View>

            {/* Progreso */}
            {data.progress && (
              <View style={styles.progressCard}>
                <Text style={styles.cardTitle}>📊 Tu progreso (4 semanas)</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {data.progress.weight_change_kg !== null
                        ? `${data.progress.weight_change_kg > 0 ? '+' : ''}${data.progress.weight_change_kg.toFixed(1)}kg`
                        : '—'}
                    </Text>
                    <Text style={styles.statLabel}>Cambio peso</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{data.progress.sessions_28d}</Text>
                    <Text style={styles.statLabel}>Sesiones</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{data.progress.adherence_pct}%</Text>
                    <Text style={styles.statLabel}>Adherencia</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{data.progress.avg_kcal}</Text>
                    <Text style={styles.statLabel}>kcal prom.</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Diagnóstico */}
            <View style={styles.diagCard}>
              <Text style={styles.cardTitle}>🔍 Diagnóstico</Text>
              <Text style={styles.diagText}>{data.analysis.diagnosis}</Text>
            </View>

            {/* Ajuste sugerido */}
            {(data.analysis.adjustments.target_kcal_delta !== 0 ||
              data.analysis.adjustments.target_protein_g_delta !== 0) && (
              <View style={styles.adjCard}>
                <Text style={styles.cardTitle}>🎯 Ajuste sugerido</Text>
                <View style={styles.deltaRow}>
                  <Text style={styles.deltaLabel}>Calorías:</Text>
                  <Text
                    style={[
                      styles.deltaValue,
                      {
                        color:
                          data.analysis.adjustments.target_kcal_delta > 0 ? '#15803d' : '#dc2626',
                      },
                    ]}
                  >
                    {data.analysis.adjustments.target_kcal_delta > 0 ? '+' : ''}
                    {data.analysis.adjustments.target_kcal_delta} kcal
                  </Text>
                </View>
                <View style={styles.deltaRow}>
                  <Text style={styles.deltaLabel}>Proteína:</Text>
                  <Text style={[styles.deltaValue, { color: '#1d4ed8' }]}>
                    {data.analysis.adjustments.target_protein_g_delta > 0 ? '+' : ''}
                    {data.analysis.adjustments.target_protein_g_delta} g
                  </Text>
                </View>
                <Text style={styles.rationale}>{data.analysis.adjustments.rationale}</Text>
                <TouchableOpacity
                  style={[styles.applyBtn, applying && { opacity: 0.5 }]}
                  onPress={applyAdjust}
                  disabled={applying}
                >
                  {applying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.applyBtnText}>Aplicar ajuste a mi plan</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Recomendaciones */}
            <View style={styles.recCard}>
              <Text style={styles.cardTitle}>💡 Recomendaciones accionables</Text>
              {data.analysis.recommendations.map((r, i) => (
                <View key={i} style={styles.recRow}>
                  <Text style={styles.recBullet}>•</Text>
                  <Text style={styles.recText}>{r}</Text>
                </View>
              ))}
            </View>

            {/* Próxima revisión */}
            <View style={styles.nextBox}>
              <Text style={styles.nextText}>
                📅 Próxima revisión sugerida: en {data.analysis.next_review_in_days} días
              </Text>
            </View>

            <TouchableOpacity style={styles.reanalyzeBtn} onPress={() => setData(null)}>
              <Text style={styles.reanalyzeBtnText}>Volver a analizar</Text>
            </TouchableOpacity>
          </>
        )}

        {data && !data.success && (
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{data.error ?? 'No se pudo generar el análisis'}</Text>
            <TouchableOpacity style={styles.analyzeBtn} onPress={analyze}>
              <Text style={styles.analyzeBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  scroll: { padding: 16, gap: 12 },

  intro: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', gap: 8 },
  introEmoji: { fontSize: 56 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  introDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 19 },
  checklistBox: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, width: '100%' },
  checklistTitle: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  checklistItem: { fontSize: 12, color: '#374151', marginTop: 2 },

  analyzeBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  analyzeBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 14 },

  center: { paddingVertical: 64, alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#374151', marginTop: 14, fontWeight: '600' },
  loadingSubtext: { fontSize: 12, color: '#6b7280', marginTop: 4 },

  verdictCard: { borderRadius: 14, padding: 18, alignItems: 'center' },
  verdictEmoji: { fontSize: 36 },
  verdictLabel: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  verdictHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 6,
  },

  progressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: {
    flexGrow: 1,
    flexBasis: '22%',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 17, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },

  diagCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6 },
  diagText: { fontSize: 13, color: '#374151', lineHeight: 19 },

  adjCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  deltaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deltaLabel: { fontSize: 13, color: '#374151' },
  deltaValue: { fontSize: 17, fontWeight: '800' },
  rationale: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 4 },
  applyBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyBtnText: { color: '#fff', fontWeight: '800' },

  recCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  recRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  recBullet: { fontSize: 14, color: '#7c3aed', fontWeight: '900' },
  recText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  nextBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12 },
  nextText: { fontSize: 12, color: '#78350f', textAlign: 'center', fontWeight: '600' },

  reanalyzeBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  reanalyzeBtnText: { color: '#6b7280', fontWeight: '700' },

  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  errorEmoji: { fontSize: 36 },
  errorText: { fontSize: 13, color: '#374151', textAlign: 'center' },
});
