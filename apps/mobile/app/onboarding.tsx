import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuthStore } from '@/store/auth.store';
import { onboardingApi, memberApi } from '@/lib/api-client';
import * as ImagePicker from 'expo-image-picker';

const TODAY = new Date().toISOString().slice(0, 10);

const PARQ_QUESTIONS = [
  { id: 'q1', text: '¿Te ha dicho un médico que tienes un problema cardíaco?' },
  { id: 'q2', text: '¿Sientes dolor en el pecho al hacer actividad física?' },
  { id: 'q3', text: '¿Has tenido mareos o desmayos durante el ejercicio en el último mes?' },
  { id: 'q4', text: '¿Tienes algún problema óseo o articular que pudiera empeorar con ejercicio?' },
  { id: 'q5', text: '¿Tomas algún medicamento para presión arterial o corazón?' },
  { id: 'q6', text: '¿Conoces alguna otra razón por la que no debas hacer ejercicio?' },
];

const GOALS = [
  { v: 'WEIGHT_LOSS', l: '🔥 Pérdida de peso', unit: 'kg' },
  { v: 'MUSCLE_GAIN', l: '💪 Ganar músculo', unit: 'kg' },
  { v: 'MAINTENANCE', l: '⚖️ Mantenimiento', unit: '' },
  { v: 'PERFORMANCE', l: '⚡ Rendimiento deportivo', unit: '' },
  { v: 'REHAB', l: '🩹 Rehabilitación', unit: '' },
];

const DESIRED_OUTCOMES = [
  { v: 'ALIVIAR_ESTRES', l: '😌 Aliviar el estrés' },
  { v: 'MEJORAR_SUENO', l: '😴 Mejorar el sueño' },
  { v: 'MAS_ENERGIA', l: '⚡ Más energía' },
  { v: 'LONGEVIDAD', l: '🌱 Envejecimiento activo' },
  { v: 'MEJOR_NUTRICION', l: '🥗 Mejorar mi nutrición' },
  { v: 'MEJORES_HABITOS', l: '✅ Mejores hábitos' },
  { v: 'CONFIANZA', l: '✨ Más confianza' },
  { v: 'ESTETICA', l: '🌸 Estética' },
  { v: 'MEJOR_POSTURA', l: '🧍 Mejorar mi postura' },
  { v: 'MAS_AGILIDAD', l: '🤸 Más agilidad' },
];

const INTENSITY_LEVELS = [
  { v: 1, l: 'Fácil' },
  { v: 2, l: 'Suave' },
  { v: 3, l: 'Moderado' },
  { v: 4, l: 'Duro' },
  { v: 5, l: 'Intenso' },
];

const PLANNING_STYLES = [
  {
    v: 'GUIDED',
    l: '🧑‍🏫 Que mi entrenador lo planifique todo',
    d: 'Ideal si prefieres seguir un plan armado por un profesional.',
  },
  {
    v: 'SELF',
    l: '📝 Yo prefiero planificar mis propios entrenamientos',
    d: 'Tendrás control total sobre tu rutina y horarios.',
  },
  {
    v: 'HYBRID',
    l: '🔀 Un poco de cada uno (híbrido)',
    d: 'Tu entrenador guía, tú ajustas según tu semana.',
  },
  {
    v: 'AI_FULL',
    l: '🤖 Que ZEUS (IA) lo planifique todo por mí',
    d: 'Recibe rutinas generadas automáticamente y adaptadas a tu progreso.',
  },
];

export default function OnboardingScreen() {
  const { accessToken } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Paso 1 — PAR-Q
  const [parqAnswers, setParqAnswers] = useState<Record<string, boolean>>({});

  // Paso 2 — Objetivo
  const [goalType, setGoalType] = useState<string>('');
  const [goalValue, setGoalValue] = useState<string>('');
  const [goalDeadline, setGoalDeadline] = useState<string>('');
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);

  // Paso 3 — Preferencias
  const [desiredOutcomes, setDesiredOutcomes] = useState<string[]>([]);
  const [intensityPreference, setIntensityPreference] = useState(3);
  const [planningStyle, setPlanningStyle] = useState<string>('');

  // Paso 4 — Foto
  const [photoUploaded, setPhotoUploaded] = useState(false);

  // Paso 5 — Contrato
  const [contractAccepted, setContractAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      if (!accessToken) return;
      try {
        const ob = await onboardingApi.get(accessToken);
        if (ob.completed_at) {
          // ya completado, sale al home
          router.replace('/(tabs)' as never);
          return;
        }
        if (ob.parq_completed) setStep(1);
        if (ob.goal_completed_at) setStep(2);
        if (ob.preferences_completed_at) setStep(3);
        if (ob.initial_photo_uploaded) setStep(4);
        if (ob.desired_outcomes?.length) setDesiredOutcomes(ob.desired_outcomes);
        if (ob.intensity_preference) setIntensityPreference(ob.intensity_preference);
        if (ob.planning_style) setPlanningStyle(ob.planning_style);
        setPhotoUploaded(ob.initial_photo_uploaded);
        setContractAccepted(ob.contract_accepted);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const skip = () => router.replace('/(tabs)' as never);

  const submitParq = async () => {
    if (!accessToken) return;
    if (Object.keys(parqAnswers).length < PARQ_QUESTIONS.length) {
      Alert.alert('Faltan respuestas', 'Por favor responde todas las preguntas.');
      return;
    }
    setSaving(true);
    try {
      const res = await onboardingApi.submitParq(accessToken, parqAnswers);
      if (res.parq_has_conditions) {
        Alert.alert(
          '⚠️ Importante',
          'Una o más respuestas indican que debes consultar con un médico antes de iniciar el programa. Tu trainer recibirá esta info.',
        );
      }
      nextStep();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const submitGoal = async () => {
    if (!accessToken || !goalType) {
      Alert.alert('Falta objetivo', 'Selecciona uno');
      return;
    }
    setSaving(true);
    try {
      const goalMeta = GOALS.find((g) => g.v === goalType);
      const value = parseFloat(goalValue);
      await onboardingApi.submitGoal(accessToken, {
        goal_type: goalType,
        goal_target_value: Number.isFinite(value) ? value : undefined,
        goal_target_unit: goalMeta?.unit || undefined,
        goal_deadline: goalDeadline || undefined,
      });
      nextStep();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const toggleOutcome = (v: string) =>
    setDesiredOutcomes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const submitPreferences = async () => {
    if (!accessToken || !planningStyle) {
      Alert.alert('Falta información', 'Selecciona cómo quieres planificar tus entrenamientos.');
      return;
    }
    setSaving(true);
    try {
      await onboardingApi.submitPreferences(accessToken, {
        desired_outcomes: desiredOutcomes,
        intensity_preference: intensityPreference,
        planning_style: planningStyle,
      });
      nextStep();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async () => {
    if (!accessToken) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    setSaving(true);
    try {
      const dataUri = `data:image/jpeg;base64,${res.assets[0].base64}`;
      await memberApi.uploadMyProgressPhoto(accessToken, {
        image: dataUri,
        category: 'FRONT',
        note: 'Foto inicial — onboarding',
      });
      await onboardingApi.markPhoto(accessToken);
      setPhotoUploaded(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo subir');
    } finally {
      setSaving(false);
    }
  };

  const submitContract = async () => {
    if (!accessToken) return;
    if (!contractAccepted) {
      Alert.alert('Acepta el contrato para continuar');
      return;
    }
    setSaving(true);
    try {
      await onboardingApi.acceptContract(accessToken, '1.0');
      router.replace('/(tabs)' as never);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido a GymApp</Text>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <View style={styles.stepperRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i === step && styles.stepDotActive,
              i < step && styles.stepDotDone,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* STEP 1: PAR-Q */}
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>📋 Cuestionario médico (PAR-Q)</Text>
            <Text style={styles.stepDesc}>
              Antes de empezar, necesitamos saber si hay algo importante sobre tu salud.
            </Text>
            {PARQ_QUESTIONS.map((q) => (
              <View key={q.id} style={styles.parqRow}>
                <Text style={styles.parqQ}>{q.text}</Text>
                <View style={styles.parqAnswers}>
                  <TouchableOpacity
                    style={[styles.parqBtn, parqAnswers[q.id] === false && styles.parqBtnNoActive]}
                    onPress={() => setParqAnswers((p) => ({ ...p, [q.id]: false }))}
                  >
                    <Text
                      style={[styles.parqBtnText, parqAnswers[q.id] === false && { color: '#fff' }]}
                    >
                      NO
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.parqBtn, parqAnswers[q.id] === true && styles.parqBtnYesActive]}
                    onPress={() => setParqAnswers((p) => ({ ...p, [q.id]: true }))}
                  >
                    <Text
                      style={[styles.parqBtnText, parqAnswers[q.id] === true && { color: '#fff' }]}
                    >
                      SÍ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.5 }]}
              onPress={submitParq}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: Objetivo */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>🎯 Tu objetivo principal</Text>
            <Text style={styles.stepDesc}>
              Esto nos ayuda a personalizar tu experiencia desde el primer día.
            </Text>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.v}
                style={[styles.goalRow, goalType === g.v && styles.goalRowActive]}
                onPress={() => setGoalType(g.v)}
              >
                <Text style={styles.goalLabel}>{g.l}</Text>
                {goalType === g.v && <Text style={styles.goalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            {GOALS.find((g) => g.v === goalType)?.unit && (
              <View style={{ gap: 6, marginTop: 8 }}>
                <Text style={styles.label}>Meta cuantificable (opcional)</Text>
                <TextInput
                  value={goalValue}
                  onChangeText={setGoalValue}
                  placeholder={`Ej: 5 ${GOALS.find((g) => g.v === goalType)?.unit ?? ''}`}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <Text style={styles.label}>Para cuándo (opcional)</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDeadlineCalendar(true)}
                >
                  <Text style={goalDeadline ? styles.dateInputText : styles.dateInputPlaceholder}>
                    {goalDeadline || 'Toca para elegir una fecha'}
                  </Text>
                  <Text style={styles.dateInputIcon}>📅</Text>
                </TouchableOpacity>
              </View>
            )}

            <Modal
              visible={showDeadlineCalendar}
              transparent
              animationType="fade"
              onRequestClose={() => setShowDeadlineCalendar(false)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowDeadlineCalendar(false)}
              >
                <TouchableOpacity activeOpacity={1} style={styles.calendarCard}>
                  <Calendar
                    current={goalDeadline || TODAY}
                    minDate={TODAY}
                    onDayPress={(day: DateData) => {
                      setGoalDeadline(day.dateString);
                      setShowDeadlineCalendar(false);
                    }}
                    markedDates={
                      goalDeadline
                        ? { [goalDeadline]: { selected: true, selectedColor: '#1d4ed8' } }
                        : {}
                    }
                    theme={{
                      todayTextColor: '#1d4ed8',
                      arrowColor: '#1d4ed8',
                      selectedDayBackgroundColor: '#1d4ed8',
                    }}
                  />
                  <TouchableOpacity
                    style={styles.calendarCloseBtn}
                    onPress={() => setShowDeadlineCalendar(false)}
                  >
                    <Text style={styles.calendarCloseBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
            <TouchableOpacity
              style={[styles.primaryBtn, (!goalType || saving) && { opacity: 0.5 }]}
              onPress={submitGoal}
              disabled={!goalType || saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Preferencias */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>✨ Tus preferencias</Text>
            <Text style={styles.stepDesc}>
              Esto ayuda a ARIA, ZEUS y a nuestro asistente de nutrición a acompañarte mejor.
            </Text>

            <Text style={styles.label}>
              ¿Qué resultados te gustaría conseguir? (elige los que quieras)
            </Text>
            <View style={styles.chipsWrap}>
              {DESIRED_OUTCOMES.map((o) => {
                const active = desiredOutcomes.includes(o.v);
                return (
                  <TouchableOpacity
                    key={o.v}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleOutcome(o.v)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.l}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              ¿Qué tan duro te gustaría entrenar?
            </Text>
            <View style={styles.intensityRow}>
              {INTENSITY_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.v}
                  style={[
                    styles.intensityDot,
                    intensityPreference >= lvl.v && styles.intensityDotActive,
                  ]}
                  onPress={() => setIntensityPreference(lvl.v)}
                >
                  <Text
                    style={[
                      styles.intensityDotText,
                      intensityPreference >= lvl.v && styles.intensityDotTextActive,
                    ]}
                  >
                    {lvl.v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intensityLabels}>
              <Text style={styles.intensityLabelText}>Fácil</Text>
              <Text style={styles.intensityLabelText}>Intenso</Text>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              ¿Cómo quieres que se planifiquen tus entrenamientos?
            </Text>
            {PLANNING_STYLES.map((p) => (
              <TouchableOpacity
                key={p.v}
                style={[styles.planRow, planningStyle === p.v && styles.goalRowActive]}
                onPress={() => setPlanningStyle(p.v)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalLabel}>{p.l}</Text>
                  <Text style={styles.planDesc}>{p.d}</Text>
                </View>
                {planningStyle === p.v && <Text style={styles.goalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, (!planningStyle || saving) && { opacity: 0.5 }]}
              onPress={submitPreferences}
              disabled={!planningStyle || saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 4: Foto inicial */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>📸 Foto inicial (privada)</Text>
            <Text style={styles.stepDesc}>
              Toma una foto frontal de tu cuerpo HOY. Solo tú la verás y será tu referencia para
              comparar el progreso.
            </Text>
            <TouchableOpacity
              style={[styles.bigBtn, photoUploaded && { backgroundColor: '#15803d' }]}
              onPress={uploadPhoto}
              disabled={saving || photoUploaded}
            >
              <Text style={styles.bigBtnText}>
                {photoUploaded ? '✓ Foto subida' : saving ? 'Subiendo…' : '📸 Subir foto'}
              </Text>
            </TouchableOpacity>
            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => nextStep()}>
                <Text style={styles.secondaryBtnText}>Saltar por ahora</Text>
              </TouchableOpacity>
              {photoUploaded && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => nextStep()}>
                  <Text style={styles.primaryBtnText}>Siguiente</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* STEP 5: Contrato */}
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>📜 Términos y condiciones</Text>
            <ScrollView style={styles.contractBox}>
              <Text style={styles.contractText}>
                Yo, como miembro de este gimnasio, acepto las siguientes condiciones:{'\n\n'}
                1. Asumo la responsabilidad de los riesgos inherentes a la práctica de actividad
                física.{'\n\n'}
                2. Confirmo que la información médica proporcionada en el cuestionario PAR-Q es
                veraz.{'\n\n'}
                3. Respetaré las normas internas del gimnasio y el uso correcto del equipamiento.
                {'\n\n'}
                4. Autorizo al gimnasio a contactarme con fines informativos relacionados con mi
                membresía y entrenamiento.{'\n\n'}
                5. Reconozco que los datos personales serán tratados con confidencialidad según la
                política de privacidad del gym.{'\n\n'}
                6. En caso de lesión por causas ajenas al gym, libero al establecimiento de
                responsabilidad legal.{'\n\n'}
                Versión: 1.0 · GymApp
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setContractAccepted((c) => !c)}
            >
              <Switch
                value={contractAccepted}
                onValueChange={setContractAccepted}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={contractAccepted ? '#15803d' : '#f4f4f5'}
              />
              <Text style={styles.checkLabel}>He leído y acepto los términos y condiciones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, (!contractAccepted || saving) && { opacity: 0.5 }]}
              onPress={submitContract}
              disabled={!contractAccepted || saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Finalizar y entrar</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#111827' },
  skipText: { color: '#6b7280', fontSize: 13 },

  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  stepDot: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb' },
  stepDotActive: { backgroundColor: '#1d4ed8' },
  stepDotDone: { backgroundColor: '#15803d' },

  scroll: { padding: 20, gap: 12 },

  stepTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  stepDesc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },

  parqRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6 },
  parqQ: { fontSize: 13, color: '#111827', fontWeight: '600' },
  parqAnswers: { flexDirection: 'row', gap: 10, marginTop: 10 },
  parqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  parqBtnYesActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  parqBtnNoActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  parqBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  goalRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  goalRowActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  goalLabel: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '600' },
  goalCheck: { fontSize: 22, color: '#1d4ed8', fontWeight: '900' },
  label: { fontSize: 11, color: '#6b7280', fontWeight: '700' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateInputText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  dateInputPlaceholder: { fontSize: 14, color: '#9ca3af' },
  dateInputIcon: { fontSize: 16 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    overflow: 'hidden',
  },
  calendarCloseBtn: { paddingVertical: 12, alignItems: 'center' },
  calendarCloseBtnText: { color: '#6b7280', fontWeight: '700', fontSize: 13 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#1d4ed8' },

  intensityRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  intensityDot: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  intensityDotActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  intensityDotText: { fontSize: 14, fontWeight: '800', color: '#9ca3af' },
  intensityDotTextActive: { color: '#fff' },
  intensityLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  intensityLabelText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },

  planRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginTop: 8,
  },
  planDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  bigBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  bigBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryBtnText: { color: '#6b7280', fontWeight: '700' },

  contractBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contractText: { fontSize: 12, color: '#374151', lineHeight: 18 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  checkLabel: { flex: 1, fontSize: 13, color: '#111827' },

  primaryBtn: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
