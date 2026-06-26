import { useEffect, useState, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '@/store/auth.store';
import { accessApi, QrCodePayload } from '@/lib/api-client';

const QR_TTL_SECONDS = 60;
const REFRESH_AT_SECONDS = 5; // refresh when 5s remain

export default function QrTab() {
  const { accessToken } = useAuthStore();
  const [qrData, setQrData] = useState<QrCodePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL_SECONDS);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQr = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await accessApi.getMyQr(accessToken);
      setQrData(data);
      const exp = new Date(data.expiresAt).getTime();
      const secs = Math.max(0, Math.floor((exp - Date.now()) / 1000));
      setSecondsLeft(secs > 0 ? secs : QR_TTL_SECONDS);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('No se pudo generar el código QR');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Countdown + auto-refresh
  useEffect(() => {
    fetchQr();
  }, [fetchQr]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= REFRESH_AT_SECONDS) {
          fetchQr();
          return QR_TTL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQr]);

  // Pulse animation when nearly expired
  useEffect(() => {
    if (secondsLeft <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [secondsLeft <= 10, pulseAnim]);

  const urgency = secondsLeft <= 10;
  const timerColor = urgency ? '#dc2626' : secondsLeft <= 20 ? '#d97706' : '#16a34a';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Acceso al Gym</Text>
        <Text style={styles.subtitle}>Muestra este código en la entrada</Text>

        {/* QR area */}
        <View style={styles.qrWrapper}>
          {loading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#1d4ed8" />
              <Text style={styles.loadingText}>Generando código...</Text>
            </View>
          ) : error ? (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchQr} style={styles.retryBtn}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : qrData ? (
            <Animated.View style={[styles.qrCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.qrInner}>
                <QRCode
                  value={qrData.qrPayload}
                  size={220}
                  color="#111827"
                  backgroundColor="#ffffff"
                  quietZone={12}
                />
              </View>
            </Animated.View>
          ) : null}
        </View>

        {/* Timer */}
        {!loading && !error && (
          <View style={styles.timerSection}>
            <View style={[styles.timerRing, { borderColor: timerColor }]}>
              <Text style={[styles.timerNumber, { color: timerColor }]}>{secondsLeft}</Text>
              <Text style={[styles.timerUnit, { color: timerColor }]}>seg</Text>
            </View>
            <Text style={styles.timerLabel}>{urgency ? '⚠️ Renovando...' : 'Válido por'}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Código dinámico · Se renueva automáticamente cada 60 segundos
          </Text>
        </View>

        {/* Manual refresh */}
        {!loading && (
          <TouchableOpacity onPress={fetchQr} style={styles.refreshBtn} activeOpacity={0.7}>
            <Text style={styles.refreshText}>↺ Renovar ahora</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: -8 },
  qrWrapper: { width: '100%', alignItems: 'center' },
  qrPlaceholder: {
    width: 260,
    height: 260,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  qrCard: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 6 },
  qrInner: { backgroundColor: '#fff', padding: 20, borderRadius: 20 },
  loadingText: { color: '#9ca3af', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  timerSection: { alignItems: 'center', gap: 8 },
  timerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNumber: { fontSize: 26, fontWeight: '800' },
  timerUnit: { fontSize: 11, fontWeight: '600', marginTop: -4 },
  timerLabel: { fontSize: 13, color: '#6b7280' },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoText: { fontSize: 12, color: '#1d4ed8', textAlign: 'center', lineHeight: 18 },
  refreshBtn: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  refreshText: { color: '#374151', fontWeight: '600', fontSize: 14 },
});
