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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { sessionApi, WorkoutPlan } from '@/lib/api-client';

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
  // planData comes in as JSON-encoded string
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start session on mount ──
  useEffect(() => {
    async function init() {
      try {
        const plan: WorkoutPlan | null = planDataParam ? JSON.parse(planDataParam) : null;
        setExercises(buildExerciseStates(plan));

        const session = await sessionApi.start(token, {
          memberId,
          planId: planId ?? undefined,
          name: planName ? `Sesión — ${planName}` : undefined,
        });
        setSessionId(session.id);
        timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
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
    };
  }, []);

  // ── Log a set ──
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
        setExercises((prev) => {
          const next = prev.map((e, ei) =>
            ei !== exIdx
              ? e
              : {
                  ...e,
                  logs: e.logs.map((l, li) => (li === setIdx ? { ...l, logged: true } : l)),
                },
          );
          return next;
        });
      } catch {
        Alert.alert('Error', 'No se pudo guardar la serie. Intenta de nuevo.');
      }
    },
    [sessionId, exercises, token],
  );

  // ── Finish session ──
  const handleFinish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    if (timerRef.current) clearInterval(timerRef.current);
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

      {/* Progress bar */}
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
          exercises.map((ex, exIdx) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={styles.exHeader}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMeta}>
                  {ex.sets} × {ex.repsMin}–{ex.repsMax} reps · {ex.restSeconds}s descanso
                </Text>
              </View>

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
                    placeholder="—"
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
          ))
        )}
      </ScrollView>

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
  exHeader: { gap: 2 },
  exName: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  exMeta: { color: '#6b7280', fontSize: 12 },

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
