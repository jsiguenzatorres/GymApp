import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { passwordApi, ApiError } from '@/lib/api-client';
import { THEME_LIGHT, COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/theme';

const T = THEME_LIGHT.colors;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await passwordApi.requestReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'No se pudo enviar el correo. Verifica la dirección.');
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: T.primary }]}>← Volver</Text>
          </TouchableOpacity>

          {sent ? (
            /* ── Success state ── */
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>📧</Text>
              <Text style={[styles.title, { color: T.text }]}>Revisa tu correo</Text>
              <Text style={[styles.successText, { color: T.textMuted }]}>
                Si existe una cuenta con{' '}
                <Text style={{ fontWeight: '600', color: T.text }}>{email}</Text>, recibirás un
                enlace para restablecer tu contraseña en los próximos minutos.
              </Text>
              <Text style={[styles.successHint, { color: T.textMuted }]}>
                No olvides revisar la carpeta de spam.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: T.primary, marginTop: SPACING[6] }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.btnText}>Volver al login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Request form ── */
            <>
              <Text style={[styles.title, { color: T.text }]}>¿Olvidaste tu contraseña?</Text>
              <Text style={[styles.subtitle, { color: T.textMuted }]}>
                Ingresa tu email y te enviaremos un enlace para restablecerla.
              </Text>

              {!!error && (
                <View
                  style={[
                    styles.errorBox,
                    { borderColor: T.danger + '40', backgroundColor: T.danger + '15' },
                  ]}
                >
                  <Text style={[styles.errorText, { color: T.danger }]}>{error}</Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: T.text }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: COLORS.zinc200, color: T.text, backgroundColor: T.surface },
                  ]}
                  placeholder="tu@email.com"
                  placeholderTextColor={T.textMuted}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  editable={!loading}
                  returnKeyType="send"
                  onSubmitEditing={handleRequest}
                />
              </View>

              <TouchableOpacity
                onPress={handleRequest}
                disabled={loading || !email.trim()}
                style={[
                  styles.btn,
                  { backgroundColor: T.primary },
                  (loading || !email.trim()) && styles.btnDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Enviar enlace</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.zinc50 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING[6], paddingVertical: SPACING[6] },
  backBtn: { marginBottom: SPACING[6] },
  backText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600' },
  title: { fontSize: TYPOGRAPHY.size['2xl'], fontWeight: '700', marginBottom: SPACING[2] },
  subtitle: { fontSize: TYPOGRAPHY.size.base, marginBottom: SPACING[6], lineHeight: 22 },
  errorBox: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  errorText: { fontSize: TYPOGRAPHY.size.sm },
  fieldGroup: { marginBottom: SPACING[5] },
  label: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: TYPOGRAPHY.size.base,
  },
  btn: { borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: TYPOGRAPHY.size.base, fontWeight: '600' },
  successBox: { alignItems: 'center', paddingTop: SPACING[8], gap: SPACING[3] },
  successIcon: { fontSize: 56 },
  successText: { fontSize: TYPOGRAPHY.size.base, textAlign: 'center', lineHeight: 24 },
  successHint: { fontSize: TYPOGRAPHY.size.sm, textAlign: 'center' },
});
