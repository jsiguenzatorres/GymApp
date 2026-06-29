import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { feedbackApi, memberApi } from '@/lib/api-client';

type Tab = 'nps' | 'suggestion' | 'complaint';

const TAB_META: Record<
  Tab,
  {
    title: string;
    emoji: string;
    color: string;
    placeholder: string;
    type: 'NPS' | 'SUGGESTION' | 'COMPLAINT';
  }
> = {
  nps: {
    title: 'Qué tan probable es que recomiendes el gym',
    emoji: '⭐',
    color: '#1d4ed8',
    placeholder: 'Opcional: cuéntanos por qué',
    type: 'NPS',
  },
  suggestion: {
    title: 'Tu sugerencia',
    emoji: '💡',
    color: '#15803d',
    placeholder: 'Ej: me encantaría tener más clases de yoga los sábados…',
    type: 'SUGGESTION',
  },
  complaint: {
    title: 'Cuéntanos qué pasó',
    emoji: '😕',
    color: '#dc2626',
    placeholder: 'Sé específico para que el gym pueda mejorar',
    type: 'COMPLAINT',
  },
};

export default function FeedbackScreen() {
  const { accessToken } = useAuthStore();
  const [tab, setTab] = useState<Tab>('nps');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    memberApi
      .getMe(accessToken)
      .then((m) => setMemberId(m.id))
      .catch(() => null);
  }, [accessToken]);

  const submit = async () => {
    if (!accessToken || !memberId) return;
    if (tab === 'nps' && npsScore === null) {
      Alert.alert('Selecciona un puntaje', 'Del 0 al 10');
      return;
    }
    if ((tab === 'suggestion' || tab === 'complaint') && !comment.trim()) {
      Alert.alert('Falta el comentario', 'Por favor escribe algo');
      return;
    }
    setSaving(true);
    try {
      await feedbackApi.create(accessToken, {
        member_id: memberId,
        type: TAB_META[tab].type,
        nps_score: tab === 'nps' ? (npsScore ?? undefined) : undefined,
        comment: comment.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu feedback fue enviado al equipo del gym.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const meta = TAB_META[tab];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Feedback</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.tabsRow}>
        {(['nps', 'suggestion', 'complaint'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => {
              setTab(t);
              setComment('');
              setNpsScore(null);
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {TAB_META[t].emoji}{' '}
              {t === 'nps' ? 'NPS' : t === 'suggestion' ? 'Sugerencia' : 'Queja'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>
            {meta.emoji} {meta.title}
          </Text>

          {tab === 'nps' && (
            <>
              <Text style={styles.subtitle}>0 = Nada probable · 10 = Definitivamente sí</Text>
              <View style={styles.npsRow}>
                {Array.from({ length: 11 }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.npsBtn,
                      npsScore === i && {
                        backgroundColor: i >= 9 ? '#15803d' : i >= 7 ? '#b45309' : '#dc2626',
                      },
                    ]}
                    onPress={() => setNpsScore(i)}
                  >
                    <Text style={[styles.npsText, npsScore === i && { color: '#fff' }]}>{i}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {npsScore !== null && (
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    textAlign: 'center',
                    marginTop: 8,
                    color: npsScore >= 9 ? '#15803d' : npsScore >= 7 ? '#b45309' : '#dc2626',
                  }}
                >
                  {npsScore >= 9
                    ? '🎉 ¡Eres un promotor!'
                    : npsScore >= 7
                      ? '🙂 Eres neutral'
                      : '😕 Cuéntanos qué pasó'}
                </Text>
              )}
            </>
          )}

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={meta.placeholder}
            style={styles.input}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: meta.color }, saving && { opacity: 0.5 }]}
            onPress={submit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Enviar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              💌 Tu feedback va directo al dueño del gym y será leído con atención.
            </Text>
          </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 28, color: '#111827', fontWeight: '400' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#1d4ed8' },
  tabText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  scroll: { padding: 20, gap: 14 },
  title: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#6b7280', textAlign: 'center' },

  npsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  npsBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  npsText: { fontSize: 14, fontWeight: '700', color: '#374151' },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  tipBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12 },
  tipText: { fontSize: 12, color: '#78350f', textAlign: 'center' },
});
