import { useState } from 'react';
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
import { memberApi, nutritionApi, TextLogResponse } from '@/lib/api-client';

const EXAMPLES = [
  'Comí 200g de pollo a la plancha con arroz y ensalada',
  '2 huevos revueltos con queso y tortilla',
  'Almorcé pupusa de queso con frijoles y curtido',
  'Snack: un banano y un puño de almendras',
];

export default function NutritionTextLogScreen() {
  const { accessToken } = useAuthStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TextLogResponse | null>(null);

  const submit = async () => {
    if (!accessToken || !text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const me = await memberApi.getMe(accessToken);
      const res = await nutritionApi.logFromText(accessToken, me.id, text.trim());
      setResult(res);
      if (res.success && res.registered.length > 0) {
        const matched = res.registered.filter((r) => r.matched).length;
        if (matched > 0) {
          // limpiar el input para próxima entrada
          setText('');
        }
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✏️ Registrar por texto</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Cuéntame qué comiste</Text>
            <Text style={styles.introDesc}>
              Escribe en tus propias palabras y la IA identifica los alimentos, estima la porción y
              los registra al diario.
            </Text>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ej: comí 200g de pollo con arroz y ensalada…"
            style={styles.input}
            multiline
            autoFocus
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!text.trim() || loading) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>✨ Registrar con IA</Text>
            )}
          </TouchableOpacity>

          {/* Ejemplos rápidos */}
          {!result && (
            <>
              <Text style={styles.examplesLabel}>O prueba con un ejemplo:</Text>
              {EXAMPLES.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={styles.exampleChip}
                  onPress={() => setText(ex)}
                  disabled={loading}
                >
                  <Text style={styles.exampleChipText}>"{ex}"</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Resultado */}
          {result && (
            <View style={styles.resultCard}>
              {result.success ? (
                <>
                  <Text style={styles.resultTitle}>
                    {result.registered.filter((r) => r.matched).length > 0
                      ? '✓ Registrado'
                      : '⚠️ Identificado pero no registrado'}
                  </Text>
                  {result.note && <Text style={styles.resultNote}>{result.note}</Text>}
                  {result.registered.map((r, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={[styles.itemEmoji, !r.matched && { color: '#9ca3af' }]}>
                        {r.matched ? '✓' : '✗'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, !r.matched && { color: '#9ca3af' }]}>
                          {r.name}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {Math.round(r.grams)}g
                          {r.matched ? ` · ${Math.round(r.kcal)} kcal` : ' · no está en la base'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {result.registered.some((r) => !r.matched) && (
                    <Text style={styles.tip}>
                      💡 Los alimentos no encontrados en la base no se registraron. Pídele al admin
                      que los registre o usa el botón "+ Registrar" manualmente.
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.resultError}>
                  {result.note ?? result.error ?? 'No se pudo procesar el mensaje.'}
                </Text>
              )}

              <TouchableOpacity onPress={() => setResult(null)} style={styles.againBtn}>
                <Text style={styles.againBtnText}>Otro mensaje</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 28, color: '#111827', fontWeight: '400' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  scroll: { padding: 16, gap: 12 },

  intro: { paddingVertical: 4, gap: 4 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  introDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19 },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  submitBtn: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  examplesLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  exampleChip: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleChipText: { fontSize: 12, color: '#374151', fontStyle: 'italic' },

  resultCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#15803d' },
  resultNote: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  resultError: { fontSize: 13, color: '#dc2626' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    gap: 10,
  },
  itemEmoji: { fontSize: 16, color: '#15803d', width: 18 },
  itemName: { fontSize: 13, color: '#111827', fontWeight: '600' },
  itemMeta: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  tip: { fontSize: 11, color: '#b45309', fontStyle: 'italic', marginTop: 6 },
  againBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  againBtnText: { color: '#fff', fontWeight: '700' },
});
