import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, memberApi } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  staff?: { first_name: string; last_name: string };
}

type Tab = 'upcoming' | 'history';
type ScreenView = 'list' | 'form';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-SV', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function statusLabel(status: Appointment['status']): string {
  switch (status) {
    case 'SCHEDULED':
      return 'Programada';
    case 'COMPLETED':
      return 'Completada';
    case 'CANCELLED':
      return 'Cancelada';
    case 'NO_SHOW':
      return 'No asistió';
  }
}

function statusBg(status: Appointment['status']): string {
  switch (status) {
    case 'SCHEDULED':
      return '#dbeafe';
    case 'COMPLETED':
      return '#dcfce7';
    case 'CANCELLED':
      return '#fee2e2';
    case 'NO_SHOW':
      return '#fee2e2';
  }
}

function statusColor(status: Appointment['status']): string {
  switch (status) {
    case 'SCHEDULED':
      return '#1d4ed8';
    case 'COMPLETED':
      return '#16a34a';
    case 'CANCELLED':
      return '#dc2626';
    case 'NO_SHOW':
      return '#dc2626';
  }
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({ appt }: { appt: Appointment }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardDateRow}>
        <Text style={styles.cardDate}>{formatDate(appt.scheduled_at)}</Text>
        <Text style={styles.cardTime}>{formatTime(appt.scheduled_at)}</Text>
      </View>

      <Text style={styles.cardTitle}>{appt.title}</Text>

      {appt.staff && (
        <Text style={styles.cardStaff}>
          Con {appt.staff.first_name} {appt.staff.last_name}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.cardDuration}>{appt.duration_minutes} min</Text>
        <View style={[styles.badge, { backgroundColor: statusBg(appt.status) }]}>
          <Text style={[styles.badgeText, { color: statusColor(appt.status) }]}>
            {statusLabel(appt.status)}
          </Text>
        </View>
      </View>

      {appt.notes ? <Text style={styles.cardNotes}>{appt.notes}</Text> : null}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>
        {tab === 'upcoming' ? 'No tienes citas programadas' : 'Sin historial'}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const { accessToken } = useAuthStore();
  const token = accessToken ?? '';

  const [memberId, setMemberId] = useState<string>('');
  const [gymId, setGymId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [currentView, setCurrentView] = useState<ScreenView>('list');

  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Load member profile on mount ──
  useEffect(() => {
    async function init() {
      try {
        const profile = await memberApi.getMe(token);
        setMemberId(profile.id);
        // gym_id comes from the profile; MemberProfile type has it via the user relation
        // The API returns gym_id at top level for members
        const raw = profile as unknown as { gym_id?: string; gymId?: string };
        setGymId(raw.gym_id ?? raw.gymId ?? '');
      } catch {
        // proceed with empty ids — fetch will still attempt
      }
    }
    init();
  }, [token]);

  // ── Fetch appointments ──
  const fetchAppointments = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [upcomingRes, historyRes] = await Promise.all([
          apiClient.get<Appointment[]>('/api/v1/appointments?status=SCHEDULED', token),
          apiClient.get<Appointment[]>('/api/v1/appointments?status=COMPLETED', token),
        ]);
        setUpcoming(Array.isArray(upcomingRes) ? upcomingRes : []);
        setHistory(Array.isArray(historyRes) ? historyRes : []);
      } catch {
        // show empty state on error
        setUpcoming([]);
        setHistory([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments(true);
  }, [fetchAppointments]);

  // ── Submit booking ──
  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Campo requerido', 'Escribe un motivo para la cita.');
      return;
    }
    if (!formDate.trim() || !formTime.trim()) {
      Alert.alert('Campo requerido', 'Ingresa la fecha y hora de la cita.');
      return;
    }

    const isoString = `${formDate.trim()}T${formTime.trim()}:00`;
    const scheduledAt = new Date(isoString);
    if (isNaN(scheduledAt.getTime())) {
      Alert.alert('Formato inválido', 'Verifica el formato de fecha (YYYY-MM-DD) y hora (HH:MM).');
      return;
    }

    const durationMinutes = parseInt(formDuration) || 60;

    setSubmitting(true);
    try {
      await apiClient.post(
        '/api/v1/appointments',
        {
          gymId,
          memberId,
          title: formTitle.trim(),
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes,
          notes: formNotes.trim() || undefined,
        },
        token,
      );

      setSubmitSuccess(true);

      // Reset form
      setFormTitle('');
      setFormDate('');
      setFormTime('');
      setFormDuration('60');
      setFormNotes('');

      // Go back to list and reload
      setTimeout(() => {
        setCurrentView('list');
        setActiveTab('upcoming');
        setSubmitSuccess(false);
        fetchAppointments(true);
      }, 1500);
    } catch {
      Alert.alert('Error', 'No se pudo crear la cita. Verifica los datos e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render list view ──
  const renderList = () => {
    const data = activeTab === 'upcoming' ? upcoming : history;

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1d4ed8"
            colors={['#1d4ed8']}
          />
        }
      >
        {data.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          data.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)
        )}
      </ScrollView>
    );
  };

  // ── Render form view ──
  const renderForm = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {submitSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Cita agendada exitosamente</Text>
          </View>
        )}

        <Text style={styles.formSectionTitle}>Nueva cita</Text>

        <Text style={styles.fieldLabel}>Motivo / Título *</Text>
        <TextInput
          value={formTitle}
          onChangeText={setFormTitle}
          placeholder="Ej. Evaluación física, Consulta trainer…"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          editable={!submitting}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Fecha *</Text>
        <TextInput
          value={formDate}
          onChangeText={setFormDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          editable={!submitting}
          returnKeyType="next"
          maxLength={10}
        />

        <Text style={styles.fieldLabel}>Hora *</Text>
        <TextInput
          value={formTime}
          onChangeText={setFormTime}
          placeholder="HH:MM"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          editable={!submitting}
          returnKeyType="next"
          maxLength={5}
        />

        <Text style={styles.fieldLabel}>Duración (minutos)</Text>
        <TextInput
          value={formDuration}
          onChangeText={setFormDuration}
          placeholder="60"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          keyboardType="number-pad"
          editable={!submitting}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Notas (opcional)</Text>
        <TextInput
          value={formNotes}
          onChangeText={setFormNotes}
          placeholder="Información adicional para el trainer…"
          placeholderTextColor="#9ca3af"
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
          editable={!submitting}
          textAlignVertical="top"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Agendar cita</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentView('list')}
          disabled={submitting}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Main render ──
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs — only shown in list view */}
      {currentView === 'list' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('upcoming')}
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Próximas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>{currentView === 'list' ? renderList() : renderForm()}</View>

      {/* FAB — only in list view */}
      {currentView === 'list' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCurrentView('form')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    minWidth: 72,
  },
  backText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    minWidth: 72,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1d4ed8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },

  // Content area
  content: {
    flex: 1,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 72,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Appointment card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'capitalize',
  },
  cardTime: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardStaff: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardDuration: {
    fontSize: 13,
    color: '#9ca3af',
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardNotes: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    marginTop: 2,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },

  // Form
  formContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 4,
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },

  // Success banner
  successBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '700',
  },
});
