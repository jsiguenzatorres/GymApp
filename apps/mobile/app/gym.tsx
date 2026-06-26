import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { gymApi } from '@/lib/api-client';
import type { GymProfile, OperatingHours, StaffMember } from '@/lib/api-client';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

const DAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

const ROLE_LABELS: Record<string, string> = {
  TRAINER: 'Entrenador',
  NUTRITIONIST: 'Nutricionista',
  RECEPTIONIST: 'Recepcionista',
  GYM_ADMIN: 'Admin',
  GYM_OWNER: 'Propietario',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function translateRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function getTodayDayOfWeek(): number {
  return new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContactChip({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.chipText}>
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );
}

function HoursRow({
  day,
  hours,
  isToday,
}: {
  day: number;
  hours?: OperatingHours;
  isToday: boolean;
}) {
  return (
    <View style={[styles.hoursRow, isToday && styles.hoursRowToday]}>
      <Text style={[styles.hoursDay, isToday && styles.hoursDayToday]}>{DAY_LABELS[day]}</Text>
      {hours ? (
        hours.is_closed ? (
          <Text style={styles.hoursClosed}>Cerrado</Text>
        ) : (
          <Text style={[styles.hoursTime, isToday && styles.hoursTimeToday]}>
            {hours.open_time} – {hours.close_time}
          </Text>
        )
      ) : (
        <Text style={styles.hoursClosed}>–</Text>
      )}
    </View>
  );
}

function SpecialtyChip({ label }: { label: string }) {
  return (
    <View style={styles.specialtyChip}>
      <Text style={styles.specialtyChipText}>{label}</Text>
    </View>
  );
}

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <View style={styles.staffCard}>
      <View style={styles.staffCardHeader}>
        <View style={styles.initialsCircle}>
          <Text style={styles.initialsText}>
            {getInitials(member.first_name, member.last_name)}
          </Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>
            {member.first_name} {member.last_name}
          </Text>
          <Text style={styles.staffRole}>{translateRole(member.role)}</Text>
        </View>
      </View>
      {member.specialties && member.specialties.length > 0 && (
        <View style={styles.specialtiesRow}>
          {member.specialties.map((s) => (
            <SpecialtyChip key={s} label={s} />
          ))}
        </View>
      )}
      {member.bio ? (
        <Text style={styles.staffBio} numberOfLines={2}>
          {member.bio}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GymScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [profile, setProfile] = useState<GymProfile | null>(null);
  const [hours, setHours] = useState<OperatingHours[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = getTodayDayOfWeek();

  const fetchAll = useCallback(async () => {
    try {
      const token = accessToken ?? '';
      const [profileRes, hoursRes, staffRes] = await Promise.allSettled([
        gymApi.getProfile(token),
        gymApi.getHours(token),
        gymApi.getStaff(token),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (hoursRes.status === 'fulfilled') setHours(hoursRes.value);
      if (staffRes.status === 'fulfilled') setStaff(staffRes.value);
    } catch {
      // individual errors handled via Promise.allSettled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  // Build a lookup map: dayOfWeek → OperatingHours
  const hoursByDay = React.useMemo(() => {
    const map: Record<number, OperatingHours> = {};
    hours.forEach((h) => {
      map[h.day_of_week] = h;
    });
    return map;
  }, [hours]);

  // Only active staff
  const activeStaff = React.useMemo(() => staff.filter((s) => s.is_active), [staff]);

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Gym</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Gym</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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
        {/* ── Section 1: Gym Profile ─────────────────────────────────────── */}
        {profile ? (
          <View style={styles.card}>
            <Text style={styles.gymName}>{profile.name}</Text>

            {profile.city || profile.address ? (
              <Text style={styles.gymLocation}>
                {[profile.city, profile.address].filter(Boolean).join(' · ')}
              </Text>
            ) : null}

            {/* Contact chips */}
            {profile.phone || profile.email || profile.website ? (
              <View style={styles.chipsRow}>
                {profile.phone ? (
                  <ContactChip
                    icon="📞"
                    label={profile.phone}
                    onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                  />
                ) : null}
                {profile.email ? (
                  <ContactChip
                    icon="📧"
                    label={profile.email}
                    onPress={() => Linking.openURL(`mailto:${profile.email}`)}
                  />
                ) : null}
                {profile.website ? (
                  <ContactChip
                    icon="🌐"
                    label={profile.website.replace(/^https?:\/\//, '')}
                    onPress={() => Linking.openURL(profile.website!)}
                  />
                ) : null}
              </View>
            ) : null}

            {profile.description ? (
              <Text style={styles.gymDescription}>{profile.description}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No se pudo cargar el perfil del gimnasio.</Text>
          </View>
        )}

        {/* ── Section 2: Operating Hours ────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Horarios</Text>

          {hours.length === 0 ? (
            <Text style={styles.emptyText}>No hay horarios disponibles en este momento.</Text>
          ) : (
            DAY_ORDER.map((day) => (
              <HoursRow key={day} day={day} hours={hoursByDay[day]} isToday={day === today} />
            ))
          )}
        </View>

        {/* ── Section 3: Staff ──────────────────────────────────────────── */}
        <View style={styles.staffSection}>
          <Text style={styles.sectionTitle}>Nuestro equipo</Text>

          {activeStaff.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No hay información de staff disponible.</Text>
            </View>
          ) : (
            activeStaff.map((member) => <StaffCard key={member.id} member={member} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 80,
  },
  backText: {
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    minWidth: 80,
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // ── Gym Profile ───────────────────────────────────────────────────────────
  gymName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  gymLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  gymDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // ── Operating Hours ───────────────────────────────────────────────────────
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hoursRowToday: {
    backgroundColor: '#eff6ff',
  },
  hoursDay: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    width: 40,
  },
  hoursDayToday: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  hoursTime: {
    fontSize: 14,
    color: '#111827',
  },
  hoursTimeToday: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  hoursClosed: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  // ── Staff section ─────────────────────────────────────────────────────────
  staffSection: {
    gap: 10,
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  staffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  initialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  staffRole: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  specialtyChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  specialtyChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  staffBio: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
