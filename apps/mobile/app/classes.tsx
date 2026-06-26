import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { classesApi } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassType {
  id: string;
  name: string;
  color: string;
  duration_minutes: number;
  difficulty?: string;
}

interface SessionWithMeta {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  capacity: number;
  room?: string;
  class_type: ClassType;
  trainer?: { first_name: string; last_name: string };
  enrolled_count: number;
  waitlist_count: number;
  is_full: boolean;
  my_enrollment?: { id: string; status: 'ENROLLED' | 'WAITLIST' | 'CANCELLED' } | null;
}

interface MyEnrollment {
  id: string;
  status: 'ENROLLED' | 'WAITLIST';
  enrolled_at: string;
  session_id: string;
  scheduled_at: string;
  room?: string;
  class_name: string;
  class_color: string;
  class_duration_minutes: number;
  trainer_first_name?: string | null;
  trainer_last_name?: string | null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  const dayName = DAY_NAMES[d.getDay()].toLowerCase();
  const dayNum = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const time = formatTime(iso);
  return `${dayName} ${dayNum} ${month} · ${time}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function buildDateRange(date: Date): { startDate: string; endDate: string } {
  const start = toLocalMidnight(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function generate14Days(): Date[] {
  const today = toLocalMidnight(new Date());
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ClassesScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [activeTab, setActiveTab] = useState<'schedule' | 'my-classes'>('schedule');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clases</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'schedule' && styles.tabPillActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabPillText, activeTab === 'schedule' && styles.tabPillTextActive]}>
            Horario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'my-classes' && styles.tabPillActive]}
          onPress={() => setActiveTab('my-classes')}
        >
          <Text
            style={[styles.tabPillText, activeTab === 'my-classes' && styles.tabPillTextActive]}
          >
            Mis Clases
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'schedule' ? (
        <ScheduleTab accessToken={accessToken} />
      ) : (
        <MyClassesTab accessToken={accessToken} />
      )}
    </View>
  );
}

// ─── Tab 1: Schedule ──────────────────────────────────────────────────────────

function ScheduleTab({ accessToken }: { accessToken: string | null }) {
  const days = generate14Days();
  const today = toLocalMidnight(new Date());

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchSessions = useCallback(
    async (date: Date) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const { startDate, endDate } = buildDateRange(date);
        const data = await classesApi.getSessions(accessToken, startDate, endDate);
        setSessions(data ?? []);
      } catch (err) {
        Alert.alert(
          'Error',
          err instanceof Error ? err.message : 'No se pudieron cargar las clases',
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate, fetchSessions]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEnroll = async (sessionId: string) => {
    if (!accessToken) return;
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const result = await classesApi.enroll(accessToken, sessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                enrolled_count: s.enrolled_count + 1,
                my_enrollment: {
                  id: result.id,
                  status: result.status as 'ENROLLED' | 'WAITLIST' | 'CANCELLED',
                },
              }
            : s,
        ),
      );
      // Reload to sync server state
      fetchSessions(selectedDate);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo realizar la reserva');
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (!accessToken) return;
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await classesApi.cancelEnrollment(accessToken, sessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                enrolled_count: Math.max(0, s.enrolled_count - 1),
                my_enrollment: null,
              }
            : s,
        ),
      );
      fetchSessions(selectedDate);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar la reserva');
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  return (
    <View style={styles.flex1}>
      {/* Date Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={styles.dateStripContent}
      >
        {days.map((date, idx) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.datePill,
                isSelected && styles.datePillSelected,
                !isSelected && isToday && styles.datePillToday,
                !isSelected && !isToday && styles.datePillDefault,
              ]}
              onPress={() => handleSelectDate(date)}
            >
              <Text
                style={[
                  styles.datePillDay,
                  isSelected && styles.datePillTextSelected,
                  !isSelected && isToday && styles.datePillTextToday,
                ]}
              >
                {DAY_NAMES[date.getDay()]}
              </Text>
              <Text
                style={[
                  styles.datePillNum,
                  isSelected && styles.datePillTextSelected,
                  !isSelected && isToday && styles.datePillTextToday,
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sessions List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyText}>No hay clases este día</Text>
        </View>
      ) : (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.listContent}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              actionLoading={!!actionLoading[session.id]}
              onEnroll={() => handleEnroll(session.id)}
              onCancel={() => handleCancel(session.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  actionLoading,
  onEnroll,
  onCancel,
}: {
  session: SessionWithMeta;
  actionLoading: boolean;
  onEnroll: () => void;
  onCancel: () => void;
}) {
  const nearlyFull = session.enrolled_count >= session.capacity * 0.8;
  const trainerName = session.trainer
    ? `Con ${session.trainer.first_name} ${session.trainer.last_name}`
    : 'Sin entrenador asignado';

  const spotsColor = session.is_full ? '#dc2626' : nearlyFull ? '#f59e0b' : '#16a34a';
  const spotsText = `${session.enrolled_count}/${session.capacity} cupos`;

  const enrollment = session.my_enrollment;
  const enrollmentStatus = enrollment?.status;

  const bottomRight = actionLoading ? (
    <ActivityIndicator size="small" color="#1d4ed8" style={styles.actionSpinner} />
  ) : enrollmentStatus === 'ENROLLED' ? (
    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCancelOutline]} onPress={onCancel}>
      <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Cancelar</Text>
    </TouchableOpacity>
  ) : enrollmentStatus === 'WAITLIST' ? (
    <TouchableOpacity
      style={[styles.actionBtn, styles.actionBtnWaitlistOutline]}
      onPress={onCancel}
    >
      <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>En espera · Cancelar</Text>
    </TouchableOpacity>
  ) : session.is_full ? (
    <TouchableOpacity
      style={[styles.actionBtn, styles.actionBtnWaitlistOutline]}
      onPress={onEnroll}
    >
      <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Lista espera</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnEnroll]} onPress={onEnroll}>
      <Text style={[styles.actionBtnText, { color: '#fff' }]}>Reservar</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.sessionCard}>
      {/* Left accent bar */}
      <View style={[styles.sessionAccent, { backgroundColor: session.class_type.color }]} />

      <View style={styles.sessionBody}>
        {/* Top row */}
        <View style={styles.sessionTopRow}>
          <Text style={styles.sessionTime}>{formatTime(session.scheduled_at)}</Text>
          <Text style={styles.sessionName}>{session.class_type.name}</Text>
          {session.class_type.difficulty ? (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{session.class_type.difficulty}</Text>
            </View>
          ) : null}
        </View>

        {/* Middle row */}
        <Text style={styles.trainerName}>{trainerName}</Text>

        {/* Bottom row */}
        <View style={styles.sessionBottomRow}>
          <Text style={styles.sessionMeta}>
            {session.duration_minutes}min{session.room ? ` · Sala ${session.room}` : ''}
          </Text>
          <View style={styles.sessionActions}>
            <View style={[styles.spotsChip, { backgroundColor: spotsColor + '1A' }]}>
              <Text style={[styles.spotsText, { color: spotsColor }]}>{spotsText}</Text>
            </View>
            {bottomRight}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Tab 2: My Classes ────────────────────────────────────────────────────────

function MyClassesTab({ accessToken }: { accessToken: string | null }) {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<Record<string, boolean>>({});

  const fetchEnrollments = useCallback(
    async (isRefresh = false) => {
      if (!accessToken) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await classesApi.getMyEnrollments(accessToken);
        setEnrollments(data ?? []);
      } catch (err) {
        Alert.alert(
          'Error',
          err instanceof Error ? err.message : 'No se pudieron cargar tus clases',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleCancel = async (sessionId: string, enrollmentId: string) => {
    if (!accessToken) return;
    setCancelLoading((prev) => ({ ...prev, [enrollmentId]: true }));
    try {
      await classesApi.cancelEnrollment(accessToken, sessionId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar la reserva');
    } finally {
      setCancelLoading((prev) => ({ ...prev, [enrollmentId]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex1}
      contentContainerStyle={enrollments.length === 0 ? styles.centeredContent : styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchEnrollments(true)}
          colors={['#1d4ed8']}
        />
      }
    >
      {enrollments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No tienes clases reservadas</Text>
        </View>
      ) : (
        enrollments.map((enrollment) => {
          const initial = enrollment.class_name.charAt(0).toUpperCase();
          const trainerName =
            enrollment.trainer_first_name && enrollment.trainer_last_name
              ? `${enrollment.trainer_first_name} ${enrollment.trainer_last_name}`
              : null;
          const isEnrolled = enrollment.status === 'ENROLLED';

          return (
            <View key={enrollment.id} style={styles.enrollmentCard}>
              {/* Left circle */}
              <View style={[styles.classCircle, { backgroundColor: enrollment.class_color }]}>
                <Text style={styles.classCircleLetter}>{initial}</Text>
              </View>

              {/* Center info */}
              <View style={styles.enrollmentInfo}>
                <Text style={styles.enrollmentClassName}>{enrollment.class_name}</Text>
                <Text style={styles.enrollmentDate}>{formatFullDate(enrollment.scheduled_at)}</Text>
                {trainerName && <Text style={styles.enrollmentTrainer}>{trainerName}</Text>}
                {enrollment.room && (
                  <Text style={styles.enrollmentRoom}>Sala {enrollment.room}</Text>
                )}
                {cancelLoading[enrollment.id] ? (
                  <ActivityIndicator
                    size="small"
                    color="#dc2626"
                    style={{ marginTop: 4, alignSelf: 'flex-start' }}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => handleCancel(enrollment.session_id, enrollment.id)}
                    style={styles.cancelLink}
                  >
                    <Text style={styles.cancelLinkText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Right status badge */}
              <View
                style={[
                  styles.statusBadge,
                  isEnrolled ? styles.statusBadgeGreen : styles.statusBadgeAmber,
                ]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: isEnrolled ? '#16a34a' : '#f59e0b' }]}
                >
                  {isEnrolled ? 'Confirmada' : 'En espera'}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  flex1: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    minWidth: 80,
  },
  backText: {
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    minWidth: 80,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    margin: 12,
    gap: 8,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  tabPillActive: {
    backgroundColor: '#1d4ed8',
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabPillTextActive: {
    color: '#fff',
  },

  // Date strip
  dateStrip: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 76,
  },
  dateStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  datePill: {
    width: 48,
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillDefault: {
    backgroundColor: '#f3f4f6',
  },
  datePillSelected: {
    backgroundColor: '#1d4ed8',
  },
  datePillToday: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1d4ed8',
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  datePillNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  datePillTextSelected: {
    color: '#fff',
  },
  datePillTextToday: {
    color: '#1d4ed8',
  },

  // Common
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    gap: 10,
  },

  // Session card
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionAccent: {
    width: 4,
  },
  sessionBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sessionTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  trainerName: {
    fontSize: 13,
    color: '#6b7280',
  },
  sessionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  sessionMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotsChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  spotsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBtnEnroll: {
    backgroundColor: '#1d4ed8',
  },
  actionBtnCancelOutline: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  actionBtnWaitlistOutline: {
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionSpinner: {
    marginHorizontal: 10,
  },

  // Enrollment card
  enrollmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  classCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  classCircleLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  enrollmentInfo: {
    flex: 1,
    gap: 2,
  },
  enrollmentClassName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  enrollmentDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  enrollmentTrainer: {
    fontSize: 13,
    color: '#6b7280',
  },
  enrollmentRoom: {
    fontSize: 13,
    color: '#6b7280',
  },
  cancelLink: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  cancelLinkText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusBadgeGreen: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeAmber: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
