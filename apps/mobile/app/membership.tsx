import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, membershipApi, MemberProfile, MembershipType } from '@/lib/api-client';

const FREEZE_OPTIONS = [7, 14, 21, 30];

export default function MembershipScreen() {
  const { accessToken } = useAuthStore();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Freeze form
  const [freezeDays, setFreezeDays] = useState(14);
  const [freezeReason, setFreezeReason] = useState('');

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');

  // Change form
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [me, availableTypes] = await Promise.all([
        memberApi.getMe(accessToken),
        membershipApi.typesAvailable(accessToken).catch(() => []),
      ]);
      setProfile(me);
      setTypes(availableTypes);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const currentMembership = profile?.memberships?.find((m) => m.status === 'ACTIVE');

  const submitFreeze = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const res = await membershipApi.requestFreeze(accessToken, {
        duration_days: freezeDays,
        reason: freezeReason.trim() || undefined,
      });
      setFreezeOpen(false);
      Alert.alert(
        'Membresía congelada',
        `Tu membresía está pausada hasta ${new Date(res.freezeEndsAt).toLocaleDateString('es-SV', {
          day: 'numeric',
          month: 'long',
        })}`,
      );
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo congelar');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCancel = async () => {
    if (!accessToken || !cancelReason.trim()) {
      Alert.alert('Razón requerida', 'Por favor indica el motivo de cancelación');
      return;
    }
    setSubmitting(true);
    try {
      await membershipApi.requestCancel(accessToken, cancelReason.trim());
      setCancelOpen(false);
      Alert.alert(
        'Solicitud recibida',
        'Tu cancelación fue procesada. Gracias por estar con nosotros 🙏',
      );
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar');
    } finally {
      setSubmitting(false);
    }
  };

  const submitChange = async () => {
    if (!accessToken || !selectedTypeId) return;
    setSubmitting(true);
    try {
      await membershipApi.requestChange(accessToken, {
        new_type_id: selectedTypeId,
        reason: changeReason.trim() || undefined,
      });
      setChangeOpen(false);
      Alert.alert(
        'Solicitud enviada',
        'El gym se pondrá en contacto contigo para coordinar el cambio',
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo solicitar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💳 Mi Membresía</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1d4ed8" />
          </View>
        ) : !currentMembership ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={styles.emptyTitle}>Sin membresía activa</Text>
            <Text style={styles.emptyDesc}>Habla con tu gym para activar o renovar tu plan.</Text>
          </View>
        ) : (
          <>
            {/* Plan actual */}
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>PLAN ACTIVO</Text>
              <Text style={styles.currentName}>{currentMembership.type.name}</Text>
              <View style={styles.currentMeta}>
                <Text style={styles.currentPrice}>
                  ${Number(currentMembership.type.price).toFixed(2)}
                  <Text style={styles.currentPriceUnit}>
                    {' '}
                    / {currentMembership.type.duration_days}d
                  </Text>
                </Text>
              </View>

              <View style={styles.datesRow}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>Inicio</Text>
                  <Text style={styles.dateValue}>
                    {new Date(currentMembership.start_date).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>Vence</Text>
                  <Text style={styles.dateValue}>
                    {new Date(currentMembership.end_date).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Acciones */}
            <Text style={styles.actionsLabel}>Opciones</Text>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setFreezeOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>❄️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Congelar membresía</Text>
                <Text style={styles.actionDesc}>
                  Pausa tu membresía si vas a estar fuera (viaje, lesión)
                </Text>
              </View>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setChangeOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Cambiar plan</Text>
                <Text style={styles.actionDesc}>Upgrade, downgrade o cambio a otro plan</Text>
              </View>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={() => setCancelOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>❌</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#dc2626' }]}>Cancelar membresía</Text>
                <Text style={styles.actionDesc}>
                  Solicita la cancelación (con período de gracia según política)
                </Text>
              </View>
              <Text style={[styles.actionChevron, { color: '#dc2626' }]}>›</Text>
            </TouchableOpacity>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 Los cambios pueden estar sujetos a las políticas de tu gym. Confirma con
                recepción si tienes dudas.
              </Text>
            </View>
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal Freeze */}
      <Modal
        visible={freezeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFreezeOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>❄️ Congelar membresía</Text>
            <Text style={styles.modalDesc}>
              ¿Por cuántos días quieres pausar? Tu membresía se reactivará automáticamente al
              terminar.
            </Text>

            <Text style={styles.modalLabel}>Duración</Text>
            <View style={styles.daysRow}>
              {FREEZE_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, freezeDays === d && styles.dayChipActive]}
                  onPress={() => setFreezeDays(d)}
                >
                  <Text style={[styles.dayChipText, freezeDays === d && { color: '#fff' }]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Motivo (opcional)</Text>
            <TextInput
              value={freezeReason}
              onChangeText={setFreezeReason}
              placeholder="Ej: viaje, lesión, examen…"
              style={styles.modalInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setFreezeOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, submitting && { opacity: 0.5 }]}
                onPress={submitFreeze}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Confirmar freeze</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Cancel */}
      <Modal
        visible={cancelOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>❌ Cancelar membresía</Text>
            <Text style={styles.modalDesc}>
              Nos importa entender por qué te vas. ¿Hay algo que pudimos hacer mejor?
            </Text>

            <Text style={styles.modalLabel}>Motivo de cancelación *</Text>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Ej: muy caro, no tengo tiempo, mudanza…"
              style={[styles.modalInput, { minHeight: 80 }]}
              multiline
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCancelOpen(false)}>
                <Text style={styles.modalCancelText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSave,
                  { backgroundColor: '#dc2626' },
                  submitting && { opacity: 0.5 },
                ]}
                onPress={submitCancel}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Confirmar cancelación</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Change Plan */}
      <Modal
        visible={changeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChangeOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>🔄 Cambiar plan</Text>
            <Text style={styles.modalDesc}>Elige a qué plan quieres cambiar.</Text>

            <ScrollView style={{ maxHeight: 280 }}>
              {types
                .filter((t) => t.id !== currentMembership?.type?.name)
                .map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeOption, selectedTypeId === t.id && styles.typeOptionActive]}
                    onPress={() => setSelectedTypeId(t.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.typeName}>{t.name}</Text>
                      <Text style={styles.typePrice}>
                        ${Number(t.price).toFixed(2)} / {t.duration_days}d
                      </Text>
                      {t.description && (
                        <Text style={styles.typeDesc} numberOfLines={2}>
                          {t.description}
                        </Text>
                      )}
                    </View>
                    {selectedTypeId === t.id && <Text style={styles.typeCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Motivo (opcional)</Text>
            <TextInput
              value={changeReason}
              onChangeText={setChangeReason}
              placeholder="Ej: necesito acceso a clases especiales…"
              style={styles.modalInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setChangeOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, (!selectedTypeId || submitting) && { opacity: 0.5 }]}
                onPress={submitChange}
                disabled={!selectedTypeId || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Solicitar cambio</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  center: { paddingVertical: 64, alignItems: 'center' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 8 },
  emptyDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },

  currentCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  currentLabel: { fontSize: 10, color: '#bfdbfe', fontWeight: '700', letterSpacing: 1 },
  currentName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 },
  currentMeta: { marginTop: 4 },
  currentPrice: { fontSize: 32, color: '#fff', fontWeight: '900' },
  currentPriceUnit: { fontSize: 13, color: '#bfdbfe', fontWeight: '600' },
  datesRow: { flexDirection: 'row', gap: 24, marginTop: 12 },
  dateBox: { alignItems: 'center' },
  dateLabel: { fontSize: 10, color: '#bfdbfe', fontWeight: '700', letterSpacing: 0.5 },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },

  actionsLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  actionDanger: { borderWidth: 1, borderColor: '#fecaca' },
  actionEmoji: { fontSize: 22 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  actionDesc: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  actionChevron: { fontSize: 22, color: '#9ca3af', fontWeight: '400' },

  tipBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12 },
  tipText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalDesc: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  modalLabel: { fontSize: 11, color: '#6b7280', fontWeight: '700', marginTop: 8 },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  dayChipActive: { backgroundColor: '#1d4ed8' },
  dayChipText: { fontSize: 14, fontWeight: '700', color: '#374151' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancel: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: { color: '#6b7280', fontWeight: '700' },
  modalSave: {
    flex: 2,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '800' },

  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginVertical: 4,
  },
  typeOptionActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  typeName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  typePrice: { fontSize: 13, color: '#1d4ed8', fontWeight: '700', marginTop: 2 },
  typeDesc: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  typeCheck: { fontSize: 24, color: '#1d4ed8', fontWeight: '900' },
});
