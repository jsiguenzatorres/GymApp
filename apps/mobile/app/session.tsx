import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { useAuthStore } from '@/store/auth.store';
import {
  sessionApi,
  exercisesApi,
  WorkoutPlan,
  WeightSuggestion,
  ExerciseHistorySession,
  ExerciseSubstitute,
} from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetLog {
  setNumber: number;
  reps: string;
  weightKg: string;
  logged: boolean;
}

interface ExerciseState {
  id: string; // plan_block_exercise id
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  logs: SetLog[];
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildExerciseStates(plan: WorkoutPlan | null): ExerciseState[] {
  if (!plan) return [];
  return plan.blocks
    .flatMap((b) => b.exercises)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pe) => ({
      id: pe.id,
      exerciseId: pe.exercise.id,
      name: pe.exercise.name,
      sets: pe.sets,
      repsMin: pe.reps_min,
      repsMax: pe.reps_max,
      restSeconds: pe.rest_seconds ?? 60,
      logs: Array.from({ length: pe.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: String(pe.reps_min),
        weightKg: '',
        logged: false,
      })),
    }));
}

// ─── Rest Timer Overlay ──────────────────────────────────────────────────────
function RestTimerOverlay({
  secondsLeft,
  totalSeconds,
  exerciseName,
  onSkip,
  onAdd,
}: {
  secondsLeft: number;
  totalSeconds: number;
  exerciseName: string;
  onSkip: () => void;
  onAdd: () => void;
}) {
  const pct = totalSeconds > 0 ? (1 - secondsLeft / totalSeconds) * 100 : 0;
  const isUrgent = secondsLeft <= 10;
  return (
    <View style={styles.restOverlay}>
      <View style={styles.restCard}>
        <Text style={styles.restLabel}>DESCANSO</Text>
        <Text style={[styles.restTime, isUrgent && { color: '#ef4444' }]}>
          {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
          {String(secondsLeft % 60).padStart(2, '0')}
        </Text>
        <Text style={styles.restExercise} numberOfLines={1}>
          Próximo: {exerciseName}
        </Text>
        <View style={styles.restProgressBar}>
          <View style={[styles.restProgressFill, { width: `${pct}%` }]} />
        </View>
        <View style={styles.restActions}>
          <TouchableOpacity style={styles.restAddBtn} onPress={onAdd}>
            <Text style={styles.restAddText}>+15s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.restSkipBtn} onPress={onSkip}>
            <Text style={styles.restSkipText}>Saltar descanso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SessionScreen() {
  const {
    token: rawToken,
    memberId,
    planId,
    planName,
  } = useLocalSearchParams<{
    token: string;
    memberId: string;
    planId?: string;
    planName?: string;
  }>();
  const planDataParam = useLocalSearchParams<{ planData?: string }>().planData;

  const { accessToken } = useAuthStore();
  const token = rawToken ?? accessToken ?? '';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [starting, setStarting] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [effort, setEffort] = useState(5);
  const [finishNotes, setFinishNotes] = useState('');
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Sugerencias de peso por ejercicio (cache)
  const [suggestions, setSuggestions] = useState<Record<string, WeightSuggestion>>({});

  // Modal: detalle de ejercicio (video + histórico + sustitutos)
  const [detailExerciseIdx, setDetailExerciseIdx] = useState<number | null>(null);
  const [detailVideo, setDetailVideo] = useState<string | null>(null);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detailHistory, setDetailHistory] = useState<ExerciseHistorySession[]>([]);
  const [detailSubstitutes, setDetailSubstitutes] = useState<ExerciseSubstitute[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Timer de descanso global
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState(0);
  const [restNextExName, setRestNextExName] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Iniciar sesión ──
  useEffect(() => {
    async function init() {
      try {
        const plan: WorkoutPlan | null = planDataParam ? JSON.parse(planDataParam) : null;
        const states = buildExerciseStates(plan);
        setExercises(states);

        const session = await sessionApi.start(token, {
          memberId,
          planId: planId ?? undefined,
          name: planName ? `Sesión — ${planName}` : undefined,
        });
        setSessionId(session.id);
        timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

        // Precargar sugerencias en background (no bloquea)
        states.forEach(async (ex) => {
          try {
            const sug = await exercisesApi.getSuggestion(token, ex.exerciseId);
            setSuggestions((prev) => ({ ...prev, [ex.exerciseId]: sug }));
          } catch {
            // silent — el ejercicio puede no tener histórico
          }
        });
      } catch {
        Alert.alert('Error', 'No se pudo iniciar la sesión. Verifica tu conexión.', [
          { text: 'Volver', onPress: () => router.back() },
        ]);
      } finally {
        setStarting(false);
      }
    }
    init();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restRef.current) clearInterval(restRef.current);
    };
  }, []);

  // ── Helper: iniciar timer de descanso ──
  const startRest = useCallback((seconds: number, nextExName: string) => {
    if (restRef.current) clearInterval(restRef.current);
    setRestTotalSeconds(seconds);
    setRestSecondsLeft(seconds);
    setRestNextExName(nextExName);
    restRef.current = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const skipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setRestSecondsLeft(0);
  }, []);

  const addRest = useCallback(() => {
    setRestSecondsLeft((s) => s + 15);
    setRestTotalSeconds((s) => s + 15);
  }, []);

  // ── Logear set ──
  const logSet = useCallback(
    async (exIdx: number, setIdx: number) => {
      if (!sessionId) return;
      const ex = exercises[exIdx];
      const log = ex.logs[setIdx];
      const reps = parseInt(log.reps) || undefined;
      const weightKg = log.weightKg ? parseFloat(log.weightKg) : undefined;

      try {
        await sessionApi.logSet(token, sessionId, {
          exerciseId: ex.exerciseId,
          setNumber: log.setNumber,
          reps,
          weightKg,
        });
        setExercises((prev) =>
          prev.map((e, ei) =>
            ei !== exIdx
              ? e
              : {
                  ...e,
                  logs: e.logs.map((l, li) => (li === setIdx ? { ...l, logged: true } : l)),
                },
          ),
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Si NO era el último set del ejercicio, iniciar descanso
        const wasLastSetOfExercise = setIdx === ex.logs.length - 1;
        if (!wasLastSetOfExercise) {
          startRest(ex.restSeconds, ex.name);
        }
      } catch {
        Alert.alert('Error', 'No se pudo guardar la serie. Intenta de nuevo.');
      }
    },
    [sessionId, exercises, token, startRest],
  );

  // ── Abrir modal de detalle del ejercicio (video + histórico + sustitutos) ──
  const openExerciseDetail = useCallback(
    async (exIdx: number) => {
      const ex = exercises[exIdx];
      setDetailExerciseIdx(exIdx);
      setDetailLoading(true);
      try {
        const [detail, history, subs] = await Promise.all([
          exercisesApi.getById(token, ex.exerciseId),
          exercisesApi.getHistory(token, ex.exerciseId, 5).catch(() => []),
          exercisesApi.getSubstitutes(token, ex.exerciseId, 6).catch(() => []),
        ]);
        setDetailVideo(detail.video_url ?? null);
        setDetailImages(detail.image_urls ?? []);
        setDetailHistory(history);
        setDetailSubstitutes(subs);
      } catch {
        // silent
      } finally {
        setDetailLoading(false);
      }
    },
    [exercises, token],
  );

  const closeDetail = () => {
    setDetailExerciseIdx(null);
    setDetailVideo(null);
    setDetailImages([]);
    setDetailHistory([]);
    setDetailSubstitutes([]);
  };

  // ── Sustituir ejercicio actual ──
  const substituteExercise = useCallback(
    (substitute: ExerciseSubstitute) => {
      if (detailExerciseIdx === null) return;
      setExercises((prev) =>
        prev.map((e, ei) =>
          ei !== detailExerciseIdx
            ? e
            : {
                ...e,
                exerciseId: substitute.id,
                name: substitute.name,
                logs: e.logs.map((l) => ({ ...l, logged: false })), // resetear logs si no se había loggeado
              },
        ),
      );
      // Re-fetch sugerencia para el nuevo ejercicio
      exercisesApi
        .getSuggestion(token, substitute.id)
        .then((sug) => setSuggestions((prev) => ({ ...prev, [substitute.id]: sug })))
        .catch(() => null);
      closeDetail();
    },
    [detailExerciseIdx, token],
  );

  // ── Finalizar sesión ──
  const handleFinish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (restRef.current) clearInterval(restRef.current);
    try {
      await sessionApi.finish(token, sessionId, {
        perceivedEffort: effort,
        notes: finishNotes || undefined,
      });
      Alert.alert(
        '¡Sesión completada!',
        `Duración: ${formatDuration(elapsed)}\nEsfuerzo: ${effort}/10`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Error', 'No se pudo finalizar la sesión.');
      setFinishing(false);
    }
  };

  const completedSets = exercises.flatMap((e) => e.logs).filter((l) => l.logged).length;
  const totalSets = exercises.flatMap((e) => e.logs).length;

  if (starting) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.startingText}>Iniciando sesión...</Text>
      </SafeAreaView>
    );
  }

  const detailEx = detailExerciseIdx !== null ? exercises[detailExerciseIdx] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('¿Abandonar sesión?', 'Tu progreso guardado hasta ahora se conservará.', [
              { text: 'Continuar entrenando', style: 'cancel' },
              {
                text: 'Salir',
                style: 'destructive',
                onPress: () => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (restRef.current) clearInterval(restRef.current);
                  router.back();
                },
              },
            ])
          }
          style={styles.exitBtn}
        >
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
          <Text style={styles.progressText}>
            {completedSets}/{totalSets} series
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowFinishModal(true)} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>Terminar</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar global */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : '0%' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.freeSession}>
            <Text style={styles.freeTitle}>Sesión libre</Text>
            <Text style={styles.freeSub}>Sin plan asignado. Entrena y termina cuando quieras.</Text>
          </View>
        ) : (
          exercises.map((ex, exIdx) => {
            const sug = suggestions[ex.exerciseId];
            return (
              <View key={ex.id} style={styles.exerciseCard}>
                <View style={styles.exHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exMeta}>
                      {ex.sets} × {ex.repsMin}–{ex.repsMax} reps · {ex.restSeconds}s descanso
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openExerciseDetail(exIdx)}
                    style={styles.infoBtn}
                  >
                    <Text style={styles.infoBtnText}>ⓘ</Text>
                  </TouchableOpacity>
                </View>

                {/* Sugerencia de peso */}
                {sug?.has_history && sug.last_weight_kg !== null && (
                  <View style={styles.suggestion}>
                    <Text style={styles.suggestionLast}>
                      Última: <Text style={styles.suggestionBold}>{sug.last_weight_kg}kg</Text>
                      {sug.last_reps !== null && (
                        <Text style={styles.suggestionBold}> × {sug.last_reps}</Text>
                      )}
                    </Text>
                    {sug.suggested_weight_kg !== null &&
                      sug.suggested_weight_kg !== sug.last_weight_kg && (
                        <Text style={styles.suggestionTry}>
                          Intenta:{' '}
                          <Text style={styles.suggestionBoldOrange}>
                            {sug.suggested_weight_kg}kg
                          </Text>
                        </Text>
                      )}
                  </View>
                )}

                {/* Column labels */}
                <View style={styles.setRow}>
                  <Text style={[styles.colLabel, { width: 28 }]}>Set</Text>
                  <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>Reps</Text>
                  <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>Kg</Text>
                  <View style={{ width: 52 }} />
                </View>

                {ex.logs.map((log, setIdx) => (
                  <View key={setIdx} style={[styles.setRow, log.logged && styles.setRowDone]}>
                    <Text style={[styles.setNum, { width: 28 }]}>{log.setNumber}</Text>

                    <TextInput
                      value={log.reps}
                      onChangeText={(v) =>
                        setExercises((prev) =>
                          prev.map((e, ei) =>
                            ei !== exIdx
                              ? e
                              : {
                                  ...e,
                                  logs: e.logs.map((l, li) =>
                                    li === setIdx ? { ...l, reps: v } : l,
                                  ),
                                },
                          ),
                        )
                      }
                      keyboardType="numeric"
                      editable={!log.logged}
                      style={[styles.setInput, log.logged && styles.setInputDone]}
                      selectTextOnFocus
                      returnKeyType="next"
                    />

                    <TextInput
                      value={log.weightKg}
                      onChangeText={(v) =>
                        setExercises((prev) =>
                          prev.map((e, ei) =>
                            ei !== exIdx
                              ? e
                              : {
                                  ...e,
                                  logs: e.logs.map((l, li) =>
                                    li === setIdx ? { ...l, weightKg: v } : l,
                                  ),
                                },
                          ),
                        )
                      }
                      keyboardType="decimal-pad"
                      placeholder={
                        sug?.suggested_weight_kg !== null && sug?.suggested_weight_kg !== undefined
                          ? String(sug.suggested_weight_kg)
                          : '—'
                      }
                      placeholderTextColor="#6b7280"
                      editable={!log.logged}
                      style={[styles.setInput, log.logged && styles.setInputDone]}
                      selectTextOnFocus
                      returnKeyType="done"
                    />

                    <TouchableOpacity
                      onPress={() => logSet(exIdx, setIdx)}
                      disabled={log.logged}
                      style={[styles.logBtn, log.logged && styles.logBtnDone]}
                    >
                      <Text style={styles.logBtnText}>{log.logged ? '✓' : 'Listo'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Overlay timer de descanso */}
      {restSecondsLeft > 0 && (
        <RestTimerOverlay
          secondsLeft={restSecondsLeft}
          totalSeconds={restTotalSeconds}
          exerciseName={restNextExName}
          onSkip={skipRest}
          onAdd={addRest}
        />
      )}

      {/* Modal: detalle de ejercicio durante sesión */}
      <Modal
        visible={detailExerciseIdx !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {detailEx?.name ?? ''}
            </Text>
            <TouchableOpacity onPress={closeDetail} style={styles.detailClose}>
              <Text style={styles.detailCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View style={styles.detailLoading}>
              <ActivityIndicator color="#f59e0b" size="large" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.detailScroll}>
              {/* Imagen / Video */}
              {detailVideo ? (
                <Video
                  source={{ uri: detailVideo }}
                  style={styles.detailVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                />
              ) : detailImages.length > 0 ? (
                <Image
                  source={{ uri: detailImages[0] }}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
              ) : null}

              {/* Histórico */}
              <Text style={styles.detailSectionTitle}>Tu progresión (últimas 5 sesiones)</Text>
              {detailHistory.length === 0 ? (
                <Text style={styles.detailEmpty}>Aún no has hecho este ejercicio.</Text>
              ) : (
                detailHistory.map((session) => (
                  <View key={session.session_id} style={styles.historyRow}>
                    <Text style={styles.historyDate}>
                      {new Date(session.date).toLocaleDateString('es-SV', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <Text style={styles.historySets} numberOfLines={1}>
                      {session.sets
                        .map(
                          (s) =>
                            `${s.weight_kg ?? '—'}kg × ${s.reps ?? '—'}${s.is_pr ? ' 🏆' : ''}`,
                        )
                        .join('  ·  ')}
                    </Text>
                  </View>
                ))
              )}

              {/* Sustitutos */}
              <Text style={styles.detailSectionTitle}>Sustituir por otro ejercicio</Text>
              <Text style={styles.detailHint}>
                Mismo grupo muscular. Solo aplica a tu sesión de hoy.
              </Text>
              {detailSubstitutes.length === 0 ? (
                <Text style={styles.detailEmpty}>Sin alternativas disponibles.</Text>
              ) : (
                detailSubstitutes.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.subRow}
                    onPress={() => substituteExercise(s)}
                  >
                    {s.image_urls?.[0] ? (
                      <Image source={{ uri: s.image_urls[0] }} style={styles.subThumb} />
                    ) : (
                      <View style={[styles.subThumb, { backgroundColor: '#374151' }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={styles.subMeta} numberOfLines={1}>
                        {s.equipment?.[0] ?? '—'} · {s.difficulty ?? 'Cualquier nivel'}
                      </Text>
                    </View>
                    <Text style={styles.subChevron}>›</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Finish session modal */}
      <Modal visible={showFinishModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Finalizar sesión</Text>
            <Text style={styles.modalSub}>Duración: {formatDuration(elapsed)}</Text>

            <Text style={styles.effortLabel}>Esfuerzo percibido: {effort}/10</Text>
            <View style={styles.effortRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setEffort(n)}
                  style={[
                    styles.effortBtn,
                    effort === n && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
                  ]}
                >
                  <Text style={[styles.effortNum, effort === n && { color: '#fff' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={finishNotes}
              onChangeText={setFinishNotes}
              placeholder="Notas opcionales (lesión, sensación, PR…)"
              placeholderTextColor="#9ca3af"
              style={styles.notesInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowFinishModal(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFinish}
                disabled={finishing}
                style={[styles.confirmFinishBtn, finishing && { opacity: 0.6 }]}
              >
                {finishing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmFinishText}>Guardar sesión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  startingText: { color: '#9ca3af', fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: { color: '#9ca3af', fontSize: 16, fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  timerText: { fontSize: 26, fontWeight: '800', color: '#f59e0b', fontVariant: ['tabular-nums'] },
  progressText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  finishBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  finishBtnText: { color: '#111827', fontWeight: '700', fontSize: 14 },

  progressBar: { height: 3, backgroundColor: '#374151' },
  progressFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 2 },

  content: { padding: 16, gap: 14, paddingBottom: 40 },

  freeSession: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  freeTitle: { color: '#f3f4f6', fontSize: 20, fontWeight: '700' },
  freeSub: { color: '#6b7280', fontSize: 14, textAlign: 'center' },

  exerciseCard: { backgroundColor: '#1f2937', borderRadius: 14, padding: 14, gap: 10 },
  exHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  exName: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  exMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBtnText: { color: '#f59e0b', fontSize: 18, fontWeight: '800' },

  suggestion: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionLast: { color: '#9ca3af', fontSize: 12 },
  suggestionTry: { color: '#9ca3af', fontSize: 12 },
  suggestionBold: { color: '#f3f4f6', fontWeight: '700' },
  suggestionBoldOrange: { color: '#f59e0b', fontWeight: '700' },

  colLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setRowDone: { opacity: 0.55 },
  setNum: { color: '#9ca3af', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  setInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f3f4f6',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInputDone: { color: '#6b7280' },
  logBtn: {
    width: 52,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logBtnDone: { backgroundColor: '#166534' },
  logBtnText: { color: '#f3f4f6', fontSize: 13, fontWeight: '700' },

  // ─── REST OVERLAY ──────────────────────────────────────────────────────────
  restOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  restCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  restLabel: {
    color: '#78350f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  restTime: {
    color: '#111827',
    fontSize: 56,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
  },
  restExercise: { color: '#78350f', fontSize: 13, fontWeight: '600', marginTop: -2 },
  restProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#fed7aa',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  restProgressFill: { height: '100%', backgroundColor: '#7c2d12' },
  restActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  restAddBtn: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  restAddText: { color: '#111827', fontWeight: '700', fontSize: 13 },
  restSkipBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  restSkipText: { color: '#f59e0b', fontWeight: '700', fontSize: 13 },

  // ─── DETAIL MODAL ──────────────────────────────────────────────────────────
  detailContainer: { flex: 1, backgroundColor: '#0f172a' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  detailTitle: { flex: 1, color: '#f3f4f6', fontSize: 17, fontWeight: '800' },
  detailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCloseText: { color: '#9ca3af', fontSize: 16, fontWeight: '700' },
  detailLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailScroll: { padding: 16, gap: 12, paddingBottom: 40 },
  detailVideo: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 12 },
  detailImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  detailSectionTitle: {
    color: '#f3f4f6',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  detailHint: { color: '#6b7280', fontSize: 12, marginBottom: 6 },
  detailEmpty: { color: '#6b7280', fontSize: 13, fontStyle: 'italic' },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    gap: 12,
  },
  historyDate: { color: '#9ca3af', fontSize: 12, fontWeight: '700', width: 60 },
  historySets: { flex: 1, color: '#f3f4f6', fontSize: 13, fontWeight: '600' },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 10,
    gap: 12,
  },
  subThumb: { width: 44, height: 44, borderRadius: 8 },
  subName: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },
  subMeta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  subChevron: { color: '#6b7280', fontSize: 22 },

  // ─── FINISH MODAL ──────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    paddingBottom: 36,
  },
  modalTitle: { color: '#f3f4f6', fontSize: 20, fontWeight: '800' },
  modalSub: { color: '#9ca3af', fontSize: 14, marginTop: -8 },
  effortLabel: { color: '#d1d5db', fontSize: 14, fontWeight: '600' },
  effortRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  effortBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  effortNum: { color: '#d1d5db', fontSize: 14, fontWeight: '600' },
  notesInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    color: '#f3f4f6',
    fontSize: 14,
    minHeight: 60,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelModalText: { color: '#d1d5db', fontWeight: '600', fontSize: 15 },
  confirmFinishBtn: {
    flex: 2,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmFinishText: { color: '#111827', fontWeight: '700', fontSize: 15 },
});
