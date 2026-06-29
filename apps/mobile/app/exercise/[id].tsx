import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Svg, { Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '@/store/auth.store';
import { exercisesApi, Exercise, ExerciseHistorySession } from '@/lib/api-client';
import { MuscleMap } from '@/components/MuscleMap';

const MUSCLE_LABEL: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  FOREARMS: 'Antebrazos',
  ABS: 'Abdomen',
  QUADS: 'Cuádriceps',
  HAMSTRINGS: 'Isquiotibiales',
  GLUTES: 'Glúteos',
  CALVES: 'Pantorrillas',
  TRAPS: 'Trapecios',
  NECK: 'Cuello',
  ADDUCTORS: 'Aductores',
  ABDUCTORS: 'Abductores',
};

const DIFFICULTY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  BEGINNER: { label: 'Básico', bg: '#dcfce7', text: '#15803d' },
  INTERMEDIATE: { label: 'Intermedio', bg: '#fef3c7', text: '#b45309' },
  ADVANCED: { label: 'Avanzado', bg: '#fee2e2', text: '#b91c1c' },
};

function muscleLabel(code: string): string {
  return MUSCLE_LABEL[code.toUpperCase()] ?? code;
}

// ─── Gráfica evolución de carga (E2) ────────────────────────────────────────
function LoadEvolutionChart({ history }: { history: ExerciseHistorySession[] }) {
  // Usa el peso máximo por sesión, en orden cronológico ascendente
  const points = history
    .filter((s) => s.sets.some((st) => st.weight_kg))
    .map((s) => ({
      date: new Date(s.date),
      max: Math.max(...s.sets.map((st) => Number(st.weight_kg ?? 0))),
    }))
    .reverse(); // BD viene desc, queremos asc para gráfica izq→der

  if (points.length < 2) return null;

  const W = 320;
  const H = 130;
  const padX = 30;
  const padY = 20;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const min = Math.min(...points.map((p) => p.max));
  const max = Math.max(...points.map((p) => p.max));
  const range = max - min || 1;

  const xs = points.map((_, i) => padX + (i * innerW) / (points.length - 1));
  const ys = points.map((p) => padY + innerH - ((p.max - min) / range) * innerH);
  const polylinePoints = xs.map((x, i) => `${x},${ys[i]}`).join(' ');

  const first = points[0].max;
  const last = points[points.length - 1].max;
  const delta = last - first;
  const deltaPct = first > 0 ? Math.round((delta / first) * 100) : 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📈 Evolución de carga</Text>
      <Text
        style={{
          fontSize: 12,
          color: delta > 0 ? '#15803d' : delta < 0 ? '#dc2626' : '#6b7280',
          fontWeight: '700',
          marginBottom: 8,
        }}
      >
        {delta > 0 ? '+' : ''}
        {delta.toFixed(1)} kg ({deltaPct > 0 ? '+' : ''}
        {deltaPct}%) en las últimas {points.length} sesiones
      </Text>
      <Svg width={W} height={H}>
        {/* Eje Y referencias */}
        <Line x1={padX} y1={padY} x2={padX} y2={H - padY} stroke="#e5e7eb" strokeWidth={1} />
        <Line
          x1={padX}
          y1={H - padY}
          x2={W - padX}
          y2={H - padY}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        <SvgText x={4} y={padY + 4} fontSize="9" fill="#9ca3af">
          {max.toFixed(0)}
        </SvgText>
        <SvgText x={4} y={H - padY + 4} fontSize="9" fill="#9ca3af">
          {min.toFixed(0)}
        </SvgText>

        {/* Línea */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Puntos */}
        {xs.map((x, i) => (
          <Circle key={i} cx={x} cy={ys[i]} r={4} fill="#fff" stroke="#1d4ed8" strokeWidth={2} />
        ))}

        {/* Última etiqueta */}
        <SvgText
          x={xs[xs.length - 1]}
          y={ys[ys.length - 1] - 8}
          fontSize="10"
          fill="#1d4ed8"
          fontWeight="bold"
          textAnchor="middle"
        >
          {last.toFixed(1)}kg
        </SvgText>
      </Svg>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 4,
          paddingHorizontal: padX,
        }}
      >
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>
          {points[0].date.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' })}
        </Text>
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>
          {points[points.length - 1].date.toLocaleDateString('es-SV', {
            day: '2-digit',
            month: 'short',
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuthStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<ExerciseHistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [frameIdx, setFrameIdx] = useState(0);
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    if (!id || !accessToken) return;
    exercisesApi
      .getById(accessToken, id)
      .then(setExercise)
      .catch(() => Alert.alert('Error', 'No se pudo cargar el ejercicio'))
      .finally(() => setLoading(false));
    exercisesApi
      .getHistory(accessToken, id, 12)
      .then(setHistory)
      .catch(() => {});
  }, [id, accessToken]);

  // Animación 2-frame en la imagen grande
  const images = exercise?.image_urls ?? [];
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setFrameIdx((i) => (i + 1) % images.length), 800);
    return () => clearInterval(t);
  }, [images.length]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Ejercicio no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const diff = exercise.difficulty ? DIFFICULTY_CONFIG[exercise.difficulty] : null;
  const primary = exercise.muscle_groups ?? [];
  const secondary = exercise.secondary_muscles ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Imagen animada — pose inicial ↔ final */}
        {images.length > 0 && (
          <View style={styles.imageCard}>
            <Image source={{ uri: images[frameIdx] }} style={styles.image} resizeMode="contain" />
            {images.length > 1 && (
              <View style={styles.frameIndicator}>
                <Text style={styles.frameText}>
                  ● Posición {frameIdx + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Video player in-app */}
        {exercise.video_url && (
          <View style={styles.videoCard}>
            <Text style={styles.sectionTitle}>Video técnico</Text>
            <Video
              ref={videoRef}
              source={{ uri: exercise.video_url }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              onPlaybackStatusUpdate={setVideoStatus}
            />
            {videoStatus && 'error' in videoStatus && videoStatus.error && (
              <Text style={styles.videoError}>No se pudo cargar el video. Revisa tu conexión.</Text>
            )}
          </View>
        )}

        {/* Tags de músculos + dificultad + equipamiento */}
        <View style={styles.tagsRow}>
          {diff && (
            <View style={[styles.tag, { backgroundColor: diff.bg }]}>
              <Text style={[styles.tagText, { color: diff.text }]}>{diff.label}</Text>
            </View>
          )}
          {(exercise.equipment ?? []).map((eq, idx) => (
            <View key={idx} style={[styles.tag, styles.equipTag]}>
              <Text style={styles.equipTagText}>
                {eq.charAt(0) + eq.slice(1).toLowerCase().replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>

        {/* Mapa muscular SVG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Músculos activados</Text>
          <View style={styles.muscleMapWrap}>
            <MuscleMap primaryMuscles={primary} secondaryMuscles={secondary} size={130} />
          </View>

          {/* Listado textual */}
          {primary.length > 0 && (
            <View style={styles.muscleListBlock}>
              <View style={styles.muscleDotLabel}>
                <View style={[styles.muscleDot, { backgroundColor: '#dc2626' }]} />
                <Text style={styles.muscleListLabel}>Activación directa</Text>
              </View>
              <Text style={styles.muscleListItems}>{primary.map(muscleLabel).join(', ')}</Text>
            </View>
          )}
          {secondary.length > 0 && (
            <View style={styles.muscleListBlock}>
              <View style={styles.muscleDotLabel}>
                <View style={[styles.muscleDot, { backgroundColor: '#fbbf24' }]} />
                <Text style={styles.muscleListLabel}>Activación indirecta</Text>
              </View>
              <Text style={styles.muscleListItems}>{secondary.map(muscleLabel).join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Descripción — para qué sirve */}
        {exercise.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Para qué sirve</Text>
            <Text style={styles.bodyText}>{exercise.description}</Text>
          </View>
        )}

        {/* Instrucciones técnicas */}
        {exercise.instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cómo ejecutarlo</Text>
            <Text style={styles.bodyText}>{exercise.instructions}</Text>
          </View>
        )}

        {/* Evolución de carga (E2) */}
        {history.length >= 2 && <LoadEvolutionChart history={history} />}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  errorText: { fontSize: 15, color: '#6b7280' },
  backBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 28, color: '#111827', fontWeight: '400' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scroll: { padding: 16, gap: 16 },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  image: { width: '100%', height: 240, borderRadius: 8 },
  frameIndicator: { marginTop: 8 },
  frameText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 8,
    marginTop: 8,
  },
  videoError: { fontSize: 12, color: '#dc2626', marginTop: 6, textAlign: 'center' },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  tagText: { fontSize: 12, fontWeight: '700' },
  equipTag: { backgroundColor: '#e0e7ff' },
  equipTagText: { fontSize: 12, color: '#3730a3', fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  bodyText: { fontSize: 14, lineHeight: 21, color: '#374151' },
  muscleMapWrap: { alignItems: 'center', marginVertical: 6 },
  muscleListBlock: { marginTop: 12 },
  muscleDotLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  muscleDot: { width: 10, height: 10, borderRadius: 5 },
  muscleListLabel: { fontSize: 12, fontWeight: '700', color: '#111827' },
  muscleListItems: { fontSize: 13, color: '#374151', paddingLeft: 16 },
});
