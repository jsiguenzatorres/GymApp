import { useEffect, useState, useCallback } from 'react';
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
import {
  memberApi,
  accessLogApi,
  MemberProfile,
  PersonalRecord,
  AccessLog,
} from '@/lib/api-client';

const ACCESS_RESULT_LABEL: Record<string, string> = {
  GRANTED: 'Acceso concedido',
  DENIED: 'Acceso denegado',
  EXPIRED: 'Membresía expirada',
  INACTIVE: 'Membresía inactiva',
};
const ACCESS_RESULT_COLOR: Record<string, string> = {
  GRANTED: '#16a34a',
  DENIED: '#dc2626',
  EXPIRED: '#d97706',
  INACTIVE: '#6b7280',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a',
  TRIAL: '#d97706',
  FREEZE: '#6366f1',
  EXPIRED: '#dc2626',
  CANCELLED: '#6b7280',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

export default function ProfileTab() {
  const { user, accessToken, logout } = useAuthStore();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setProfile(me);
      const [records, logsRes] = await Promise.all([
        memberApi.getPRs(me.id, accessToken),
        accessLogApi.getMyLogs(me.id, accessToken).catch(() => ({ data: [] })),
      ]);
      setPrs(records ?? []);
      setAccessLogs((logsRes?.data ?? []).slice(0, 10));
    } catch {
      // ok
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  const firstName = profile?.first_name ?? user?.firstName ?? '';
  const lastName = profile?.last_name ?? user?.lastName ?? '';
  const email = profile?.user?.email ?? user?.email ?? '';
  const activeMembership = profile?.memberships?.find(
    (m) => m.status === 'ACTIVE' || m.status === 'TRIAL',
  );
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header row with settings button */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileHeaderTitle}>Mi perfil</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>
          <Text style={styles.name}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.email}>{email}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: (STATUS_COLOR[profile?.status ?? ''] ?? '#6b7280') + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: STATUS_COLOR[profile?.status ?? ''] ?? '#6b7280' },
              ]}
            >
              {profile?.status === 'ACTIVE' ? '● Miembro activo' : (profile?.status ?? 'Inactivo')}
            </Text>
          </View>
        </View>

        {/* Membership */}
        {activeMembership && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Membresía actual</Text>
            <Text style={styles.membershipName}>{activeMembership.type.name}</Text>
            <View style={styles.membershipRow}>
              <View style={styles.membershipStat}>
                <Text style={styles.membershipStatVal}>{daysUntil(activeMembership.end_date)}</Text>
                <Text style={styles.membershipStatLbl}>Días restantes</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.membershipStat}>
                <Text style={styles.membershipStatVal}>${activeMembership.type.price}</Text>
                <Text style={styles.membershipStatLbl}>Costo mensual</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.membershipStat}>
                <Text style={styles.membershipStatVal}>{activeMembership.type.duration_days}</Text>
                <Text style={styles.membershipStatLbl}>Días del plan</Text>
              </View>
            </View>
            <Text style={styles.vence}>Vence: {formatDate(activeMembership.end_date)}</Text>
          </View>
        )}

        {/* Personal Records */}
        {prs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Récords personales 🏆</Text>
            <View style={styles.prList}>
              {prs.slice(0, 5).map((pr) => (
                <View key={pr.id} style={styles.prRow}>
                  <Text style={styles.prExercise}>{pr.exercise.name}</Text>
                  <Text style={styles.prValue}>
                    {pr.value} {pr.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}
          {profile?.user?.last_login_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Último acceso</Text>
              <Text style={styles.infoValue}>{formatDate(profile.user.last_login_at)}</Text>
            </View>
          )}
        </View>

        {/* Access history */}
        {accessLogs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimas visitas</Text>
            <View style={styles.logList}>
              {accessLogs.map((log) => {
                const color = ACCESS_RESULT_COLOR[log.result] ?? '#6b7280';
                const label = ACCESS_RESULT_LABEL[log.result] ?? log.result;
                return (
                  <View key={log.id} style={styles.logRow}>
                    <View style={[styles.logDot, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logLabel}>{label}</Text>
                      <Text style={styles.logDate}>
                        {new Date(log.created_at).toLocaleDateString('es-SV', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        {new Date(log.created_at).toLocaleTimeString('es-SV', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.logMethod, { color }]}>{log.method ?? 'QR'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  profileHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  settingsBtn: { padding: 4 },
  settingsIcon: { fontSize: 22 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6b7280' },
  statusBadge: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  membershipName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  membershipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  membershipStat: { flex: 1, alignItems: 'center', gap: 2 },
  membershipStatVal: { fontSize: 20, fontWeight: '800', color: '#1d4ed8' },
  membershipStatLbl: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  divider: { width: 1, height: 36, backgroundColor: '#f3f4f6' },
  vence: { fontSize: 13, color: '#9ca3af' },
  prList: { gap: 8 },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prExercise: { fontSize: 14, color: '#374151', flex: 1 },
  prValue: { fontSize: 14, fontWeight: '700', color: '#1d4ed8' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: { fontSize: 13, color: '#9ca3af' },
  infoValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
  logList: { gap: 10 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  logDate: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  logMethod: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
