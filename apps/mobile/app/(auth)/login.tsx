import { useState, useEffect } from 'react';
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
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/auth.store';
import { authApi, onboardingApi, ApiError } from '@/lib/api-client';
import { registerPushToken } from '@/lib/push';
import { THEME_LIGHT, COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/theme';

const T = THEME_LIGHT.colors;
const BIOMETRIC_EMAIL_KEY = 'gymapp_biometric_email';
const BIOMETRIC_PWD_KEY = 'gymapp_biometric_pwd';

export default function LoginScreen() {
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then((has) => {
      if (has) {
        LocalAuthentication.isEnrolledAsync().then((enrolled) => {
          setBiometricAvailable(enrolled);
        });
      }
    });
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Accede a GymApp',
        fallbackLabel: 'Usar contraseña',
      });
      if (!result.success) return;

      const savedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const savedPwd = await SecureStore.getItemAsync(BIOMETRIC_PWD_KEY);
      if (!savedEmail || !savedPwd) {
        setError('Primero inicia sesión con email y contraseña para activar biométrico.');
        return;
      }
      setIsLoading(true);
      const data = await authApi.login(savedEmail, savedPwd);
      await setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      registerPushToken(data.accessToken).catch(() => null);
      // Onboarding check (solo miembros)
      if (data.user.role === 'MEMBER' || data.user.role === 'MEMBER_TRIAL') {
        try {
          const ob = await onboardingApi.get(data.accessToken);
          if (!ob.completed_at) {
            router.replace('/onboarding' as never);
            return;
          }
        } catch {
          // si falla, vamos al home igual
        }
      }
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message || 'Error de autenticación');
      else setError('Error biométrico. Usa email y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setError('');

    try {
      const data = await authApi.login(email.trim().toLowerCase(), password, totp || undefined);
      await setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      registerPushToken(data.accessToken).catch(() => null);
      // Onboarding check (solo miembros)
      if (data.user.role === 'MEMBER' || data.user.role === 'MEMBER_TRIAL') {
        try {
          const ob = await onboardingApi.get(data.accessToken);
          if (!ob.completed_at) {
            router.replace('/onboarding' as never);
            return;
          }
        } catch {
          // si falla, vamos al home igual
        }
      }
      // Save credentials so biometric login can reuse them
      if (biometricAvailable) {
        await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email.trim().toLowerCase());
        await SecureStore.setItemAsync(BIOMETRIC_PWD_KEY, password);
      }
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message === 'two_fa_required') {
          setShowTotp(true);
          setError('Ingresa tu código de autenticación de dos factores');
        } else {
          setError(err.message || 'Credenciales inválidas');
        }
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <View style={[styles.logoBar, { backgroundColor: T.primary }]} />
              <View style={[styles.logoHandle, { backgroundColor: T.premium }]} />
              <View style={[styles.logoBar, { backgroundColor: T.primary }]} />
            </View>
            <Text style={[styles.logoText, { color: T.text }]}>GymApp</Text>
          </View>

          <Text style={[styles.title, { color: T.text }]}>Bienvenido</Text>
          <Text style={[styles.subtitle, { color: T.textMuted }]}>
            Ingresa tus credenciales para continuar
          </Text>

          {/* Error */}
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

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: T.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: COLORS.zinc200, color: T.text, backgroundColor: T.surface },
              ]}
              placeholder="admin@tugimnasio.com"
              placeholderTextColor={T.textMuted}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: T.text }]}>Contraseña</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputFlex,
                  { borderColor: COLORS.zinc200, color: T.text, backgroundColor: T.surface },
                ]}
                placeholder="••••••••"
                placeholderTextColor={T.textMuted}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Text style={{ color: T.textMuted, fontSize: 12 }}>
                  {showPassword ? 'OCULTAR' : 'VER'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle 2FA */}
          {!showTotp && (
            <TouchableOpacity onPress={() => setShowTotp(true)} style={styles.totpToggle}>
              <Text style={[styles.totpToggleText, { color: T.textMuted }]}>
                Tengo autenticación de dos factores (2FA)
              </Text>
            </TouchableOpacity>
          )}

          {/* TOTP */}
          {showTotp && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: T.text }]}>Código 2FA</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputCenter,
                  { borderColor: T.primary, color: T.text, backgroundColor: T.surface },
                ]}
                placeholder="000000"
                placeholderTextColor={T.textMuted}
                value={totp}
                onChangeText={(v) => {
                  setTotp(v);
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                autoFocus
              />
              <Text style={[styles.hint, { color: T.textMuted }]}>
                Código de 6 dígitos de tu autenticador
              </Text>
            </View>
          )}

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={[styles.forgotText, { color: T.primary }]}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón submit */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
            style={[
              styles.btn,
              { backgroundColor: T.primary },
              (isLoading || !email || !password) && styles.btnDisabled,
            ]}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          {/* Biometric login */}
          {biometricAvailable && (
            <TouchableOpacity
              onPress={handleBiometricLogin}
              disabled={isLoading}
              style={[styles.biometricBtn, { borderColor: T.primary + '40' }]}
            >
              <Text style={[styles.biometricText, { color: T.primary }]}>
                🔑 Acceder con Face ID / Huella
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.footer, { color: T.textMuted }]}>
            ¿Eres miembro? <Text style={{ color: T.primary }}>Contacta a tu gimnasio</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.zinc50 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING[6], paddingVertical: SPACING[8] },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING[8] },
  logoMark: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logoBar: { width: 5, height: 18, borderRadius: 2 },
  logoHandle: { width: 8, height: 8, borderRadius: 2 },
  logoText: { fontSize: TYPOGRAPHY.size.xl, fontWeight: '700' },
  title: { fontSize: TYPOGRAPHY.size['3xl'], fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: TYPOGRAPHY.size.base, marginBottom: SPACING[6] },
  errorBox: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  errorText: { fontSize: TYPOGRAPHY.size.sm },
  fieldGroup: { marginBottom: SPACING[4] },
  label: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: TYPOGRAPHY.size.base,
  },
  inputFlex: { flex: 1 },
  inputCenter: { textAlign: 'center', letterSpacing: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  totpToggle: { marginBottom: SPACING[4] },
  totpToggleText: { fontSize: TYPOGRAPHY.size.sm },
  hint: { fontSize: TYPOGRAPHY.size.xs, marginTop: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING[3] },
  forgotText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '500' },
  btn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING[2],
    marginBottom: SPACING[4],
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: TYPOGRAPHY.size.base, fontWeight: '600' },
  biometricBtn: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  biometricText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: TYPOGRAPHY.size.sm },
});
