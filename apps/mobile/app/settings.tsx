import { useState, useCallback } from 'react';
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
import { memberApi, profileApi, ApiError } from '@/lib/api-client';

// ─── Section component ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  destructive,
  rightIcon,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightIcon?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress && <Text style={styles.rowChevron}>{rightIcon ?? '›'}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, accessToken, logout } = useAuthStore();

  const [memberId, setMemberId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load current values lazily when edit opens
  const openEdit = useCallback(async () => {
    if (!accessToken) return;
    try {
      const me = await memberApi.getMe(accessToken);
      setMemberId(me.id);
      setFirstName(me.first_name);
      setLastName(me.last_name);
      setPhone(me.phone ?? '');
      setEditOpen(true);
    } catch {
      Alert.alert('Error', 'No se pudo cargar tu perfil.');
    }
  }, [accessToken]);

  const saveProfile = async () => {
    if (!accessToken || !memberId) return;
    setSaving(true);
    setSaveError('');
    try {
      await profileApi.update(memberId, accessToken, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setEditOpen(false);
      Alert.alert('Guardado', 'Tu perfil ha sido actualizado.');
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message || 'Error al guardar' : 'Error de conexión.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Edit profile panel ── */}
          {editOpen ? (
            <Section title="Editar perfil">
              {!!saveError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.fieldInput}
                  placeholder="Nombre"
                  placeholderTextColor="#9ca3af"
                  editable={!saving}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Apellido</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.fieldInput}
                  placeholder="Apellido"
                  placeholderTextColor="#9ca3af"
                  editable={!saving}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Teléfono</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.fieldInput}
                  placeholder="+503 7000-0000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  editable={!saving}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveProfile}
                  disabled={saving}
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Section>
          ) : (
            <Section title="Cuenta">
              <Row
                label="Nombre"
                value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || '—'}
              />
              <Divider />
              <Row label="Email" value={user?.email ?? '—'} />
              <Divider />
              <Row label="Editar perfil" onPress={openEdit} />
            </Section>
          )}

          {/* ── Security ── */}
          <Section title="Seguridad">
            <Row
              label="Cambiar contraseña"
              onPress={() => {
                router.back();
                // Give time for the modal to dismiss before pushing
                setTimeout(() => router.push('/(auth)/forgot-password'), 350);
              }}
            />
          </Section>

          {/* ── Preferences ── */}
          <Section title="Preferencias">
            <Row label="Idioma" value="Español" />
            <Divider />
            <Row label="Notificaciones" value="Activadas" />
          </Section>

          {/* ── App info ── */}
          <Section title="Acerca de">
            <Row label="Versión" value="1.0.0" />
            <Divider />
            <Row label="Términos y condiciones" onPress={() => {}} />
            <Divider />
            <Row label="Política de privacidad" onPress={() => {}} />
          </Section>

          {/* ── Danger zone ── */}
          <Section title="">
            <Row label="Cerrar sesión" onPress={handleLogout} destructive />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { padding: 4 },
  backText: { color: '#1d4ed8', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  content: { padding: 16, gap: 8, paddingBottom: 48 },

  section: { gap: 6 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLabel: { fontSize: 15, color: '#111827' },
  rowLabelDestructive: { color: '#dc2626' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: '#6b7280', maxWidth: 180, textAlign: 'right' },
  rowChevron: { fontSize: 18, color: '#9ca3af', fontWeight: '300' },

  divider: { height: 0.5, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  errorBox: { margin: 12, borderRadius: 8, padding: 10, backgroundColor: '#fee2e2' },
  errorText: { fontSize: 13, color: '#dc2626' },

  fieldGroup: { paddingHorizontal: 16, paddingTop: 12 },
  fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' },
  fieldInput: {
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },

  editActions: { flexDirection: 'row', gap: 8, padding: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
  },
  cancelBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
