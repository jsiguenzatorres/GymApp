import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, zeusApi, WorkoutPlan } from '@/lib/api-client';
import { useStt } from '@/hooks/useStt';
import { useTts } from '@/hooks/useTts';

interface Message {
  role: 'user' | 'zeus';
  text: string;
}

const SUGGESTIONS = [
  '¿Qué ejercicio hago hoy?',
  '¿Cuántas series me faltan?',
  '¿Cómo mejoro mi sentadilla?',
  'Sustituye el ejercicio actual',
];

export default function WorkoutTab() {
  const { accessToken } = useAuthStore();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [zeusOpen, setZeusOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const flatRef = useRef<FlatList>(null);
  const stt = useStt(accessToken);
  const tts = useTts(accessToken);

  const loadPlan = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);
      const plans = await memberApi.getPlans(me.id, accessToken);
      setPlan(plans?.[0] ?? null);
    } catch {
      // no plan yet
    } finally {
      setLoadingPlan(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !accessToken || sending) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await zeusApi.chat(text.trim(), accessToken, memberId ?? undefined);
      setMessages((prev) => [...prev, { role: 'zeus', text: res.reply }]);
      if (ttsEnabled && res.reply) tts.speak(res.reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'zeus', text: 'Error al conectar con ZEUS. Intenta de nuevo.' },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Entrenamiento</Text>
            <TouchableOpacity
              style={[styles.zeusBtn, zeusOpen && styles.zeusBtnActive]}
              onPress={() => setZeusOpen((v) => !v)}
            >
              <Text style={styles.zeusBtnText}>⚡ ZEUS</Text>
            </TouchableOpacity>
          </View>

          {/* ZEUS Chat */}
          {zeusOpen && (
            <View style={styles.zeusBox}>
              <View style={styles.zeusHeader}>
                <View>
                  <Text style={styles.zeusTitle}>⚡ ZEUS Coach IA</Text>
                  <Text style={styles.zeusSubtitle}>Tu entrenador personal en tiempo real</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setTtsEnabled((v) => !v);
                    if (tts.isPlaying) tts.stop();
                  }}
                  style={[styles.ttsToggle, ttsEnabled && styles.ttsToggleOn]}
                >
                  <Text style={styles.ttsToggleText}>{ttsEnabled ? '🔊' : '🔇'}</Text>
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <View style={styles.messagesContainer}>
                {messages.length === 0 && (
                  <>
                    <Text style={styles.emptyChat}>¿En qué te ayudo hoy?</Text>
                    <View style={styles.suggestions}>
                      {SUGGESTIONS.map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => sendMessage(s)}
                          style={styles.chip}
                        >
                          <Text style={styles.chipText}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                {messages.map((m, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      m.role === 'user' ? styles.bubbleUser : styles.bubbleZeus,
                    ]}
                  >
                    {m.role === 'zeus' && <Text style={styles.bubbleLabel}>ZEUS</Text>}
                    <Text style={[styles.bubbleText, m.role === 'user' && { color: '#fff' }]}>
                      {m.text}
                    </Text>
                  </View>
                ))}
                {sending && (
                  <View style={styles.bubbleZeus}>
                    <ActivityIndicator size="small" color="#f59e0b" />
                  </View>
                )}
              </View>

              {/* Input */}
              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={stt.isRecording ? 'Escuchando…' : 'Pregunta a ZEUS...'}
                  placeholderTextColor={stt.isRecording ? '#f59e0b' : '#9ca3af'}
                  style={styles.textInput}
                  onSubmitEditing={() => sendMessage(input)}
                  returnKeyType="send"
                  editable={!sending && !stt.isRecording}
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (stt.isRecording) {
                      const text = await stt.stopAndTranscribe();
                      if (text?.trim()) sendMessage(text);
                    } else {
                      await stt.startRecording();
                    }
                  }}
                  disabled={sending}
                  style={[styles.micBtn, stt.isRecording && styles.micBtnActive]}
                >
                  <Text style={styles.micBtnText}>{stt.isRecording ? '⏹' : '🎙'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || sending || stt.isRecording}
                  style={[
                    styles.sendBtn,
                    (!input.trim() || sending || stt.isRecording) && { opacity: 0.4 },
                  ]}
                >
                  <Text style={styles.sendBtnText}>↑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Workout plan */}
          {loadingPlan ? (
            <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
          ) : !plan ? (
            <View style={styles.emptyPlan}>
              <Text style={styles.emptyPlanEmoji}>🏋️</Text>
              <Text style={styles.emptyPlanTitle}>Sin plan asignado</Text>
              <Text style={styles.emptyPlanSub}>Pídele a tu entrenador que te asigne un plan</Text>
              <TouchableOpacity
                style={styles.startFreeBtn}
                onPress={() =>
                  router.push({
                    pathname: '/session',
                    params: { memberId: memberId ?? '', token: accessToken ?? '' },
                  })
                }
              >
                <Text style={styles.startFreeBtnText}>▶ Sesión libre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.planContainer}>
              <View style={styles.planHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.goal && <Text style={styles.planGoal}>Objetivo: {plan.goal}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.startSessionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/session',
                      params: {
                        memberId: memberId ?? '',
                        token: accessToken ?? '',
                        planId: plan.id,
                        planName: plan.name,
                        planData: JSON.stringify(plan),
                      },
                    })
                  }
                >
                  <Text style={styles.startSessionBtnText}>▶ Entrenar</Text>
                </TouchableOpacity>
              </View>

              {(plan.blocks ?? [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((block) => (
                  <View key={block.id} style={styles.block}>
                    <Text style={styles.blockName}>{block.name}</Text>
                    <Text style={styles.blockType}>{block.block_type}</Text>
                    {(block.exercises ?? [])
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((ex) => (
                        <View key={ex.id} style={styles.exercise}>
                          <View style={styles.exerciseHeader}>
                            <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                            <Text style={styles.exerciseSets}>
                              {ex.sets} × {ex.reps_min}–{ex.reps_max}
                            </Text>
                          </View>
                          {ex.exercise.muscle_groups?.length > 0 && (
                            <Text style={styles.muscles}>
                              {ex.exercise.muscle_groups.join(', ')}
                            </Text>
                          )}
                          <Text style={styles.rest}>Descanso: {ex.rest_seconds}s</Text>
                        </View>
                      ))}
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  zeusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1917',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  zeusBtnActive: { backgroundColor: '#78350f' },
  zeusBtnText: { color: '#fbbf24', fontWeight: '700', fontSize: 14 },
  zeusBox: { backgroundColor: '#1c1917', borderRadius: 16, overflow: 'hidden' },
  zeusHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zeusTitle: { color: '#fbbf24', fontSize: 15, fontWeight: '700' },
  zeusSubtitle: { color: '#78716c', fontSize: 12, marginTop: 2 },
  ttsToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#292524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ttsToggleOn: { backgroundColor: '#451a03' },
  ttsToggleText: { fontSize: 16 },
  messagesContainer: { padding: 16, gap: 10, minHeight: 120 },
  emptyChat: { color: '#a8a29e', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  suggestions: { gap: 8 },
  chip: { backgroundColor: '#292524', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: '#d6d3d1', fontSize: 13 },
  bubble: { borderRadius: 12, padding: 12, maxWidth: '85%' },
  bubbleUser: { backgroundColor: '#1d4ed8', alignSelf: 'flex-end' },
  bubbleZeus: { backgroundColor: '#292524', alignSelf: 'flex-start' },
  bubbleLabel: { color: '#f59e0b', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  bubbleText: { color: '#d6d3d1', fontSize: 14, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#292524',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  micBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#292524',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: { backgroundColor: '#7f1d1d' },
  micBtnText: { fontSize: 18 },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#f59e0b',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
  emptyPlan: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyPlanEmoji: { fontSize: 48 },
  emptyPlanTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptyPlanSub: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  startFreeBtn: {
    marginTop: 4,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startFreeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  planContainer: { gap: 12 },
  planHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  planGoal: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  startSessionBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  startSessionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  block: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  blockName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  blockType: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', marginTop: -6 },
  exercise: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, gap: 4 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  exerciseSets: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  muscles: { fontSize: 12, color: '#9ca3af' },
  rest: { fontSize: 12, color: '#9ca3af' },
});
