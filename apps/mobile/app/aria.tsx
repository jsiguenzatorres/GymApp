import { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, ariaApi } from '@/lib/api-client';
import { useTts } from '@/hooks/useTts';
import { useStt } from '@/hooks/useStt';

interface Message {
  role: 'user' | 'aria';
  text: string;
}

const SUGGESTIONS = [
  '¿Cuándo vence mi membresía?',
  'Quiero congelar mi membresía',
  'Agendar una cita con el trainer',
  '¿Qué promociones tienen?',
  'Tengo una queja o sugerencia',
];

export default function AriaScreen() {
  const { accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const { isPlaying, speak, stop } = useTts(accessToken);
  const { isRecording, startRecording, stopAndTranscribe } = useStt(accessToken);

  // Load memberId lazily on first message
  const ensureMemberId = useCallback(async (): Promise<string | null> => {
    if (memberId) return memberId;
    if (!accessToken) return null;
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);
      return me.id;
    } catch {
      return null;
    }
  }, [memberId, accessToken]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !accessToken || sending) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const mid = await ensureMemberId();
      const res = await ariaApi.chat(text.trim(), accessToken, mid ?? undefined);
      const reply = res.reply;
      setMessages((prev) => [...prev, { role: 'aria', text: reply }]);
      void speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'aria',
          text: 'Lo siento, no puedo responder ahora. Intenta de nuevo en un momento.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatarDot} />
          <View>
            <Text style={styles.headerName}>ARIA</Text>
            <Text style={styles.headerSub}>Asistente del gimnasio · En línea</Text>
          </View>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome message */}
          <View style={styles.bubbleAria}>
            <Text style={styles.bubbleLabel}>ARIA</Text>
            <Text style={styles.bubbleText}>
              ¡Hola! Soy ARIA, tu asistente personal del gimnasio. Puedo ayudarte con tu membresía,
              citas, información sobre clases, y mucho más. ¿En qué te puedo ayudar?
            </Text>
          </View>

          {/* Suggestion chips (shown only at start) */}
          {messages.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              <View style={styles.chipsRow}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} onPress={() => sendMessage(s)} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <View key={i} style={m.role === 'user' ? styles.bubbleUser : styles.bubbleAria}>
              {m.role === 'aria' && <Text style={styles.bubbleLabel}>ARIA</Text>}
              <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleUserText]}>
                {m.text}
              </Text>
            </View>
          ))}

          {/* Typing indicator */}
          {sending && (
            <View style={styles.bubbleAria}>
              <Text style={styles.bubbleLabel}>ARIA</Text>
              <View style={styles.typingRow}>
                <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          {/* Mic button */}
          <TouchableOpacity
            onPress={async () => {
              if (isRecording) {
                const text = await stopAndTranscribe();
                if (text) sendMessage(text);
              } else {
                await startRecording();
              }
            }}
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
          >
            <Text style={styles.micBtnText}>{isRecording ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#9ca3af"
            style={styles.textInput}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            editable={!sending && !isRecording}
            multiline
          />

          {/* Stop TTS or Send */}
          {isPlaying ? (
            <TouchableOpacity onPress={stop} style={styles.sendBtn}>
              <Text style={styles.sendBtnText}>⏸</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>↑</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3e8ff',
  },
  backBtn: { padding: 4 },
  backText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 11, color: '#16a34a', marginTop: 1 },

  messagesList: { padding: 16, gap: 10, paddingBottom: 20 },

  bubbleAria: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    gap: 4,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
  },
  bubbleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubbleText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  bubbleUserText: { color: '#fff' },

  typingRow: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#c4b5fd' },

  chips: { marginBottom: 4 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  chip: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, color: '#5b21b6', fontWeight: '500' },

  inputBar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3e8ff',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  micBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: { backgroundColor: '#fee2e2' },
  micBtnText: { fontSize: 18 },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
