import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { exercisesApi } from '@/lib/api-client';
import type { Exercise } from '@/lib/api-client';

const MUSCLE_GROUP_CHIPS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pecho', value: 'pecho' },
  { label: 'Espalda', value: 'espalda' },
  { label: 'Hombros', value: 'hombros' },
  { label: 'Bíceps', value: 'biceps' },
  { label: 'Tríceps', value: 'triceps' },
  { label: 'Piernas', value: 'piernas' },
  { label: 'Glúteos', value: 'gluteos' },
  { label: 'Core', value: 'core' },
  { label: 'Cardio', value: 'cardio' },
];

const MUSCLE_GROUP_MAP: Record<string, string> = {
  chest: 'pecho',
  back: 'espalda',
  lats: 'espalda',
  shoulders: 'hombros',
  delts: 'hombros',
  biceps: 'biceps',
  triceps: 'triceps',
  legs: 'piernas',
  quadriceps: 'piernas',
  quads: 'piernas',
  hamstrings: 'piernas',
  calves: 'piernas',
  glutes: 'gluteos',
  core: 'core',
  abs: 'core',
  abdominals: 'core',
  cardio: 'cardio',
  pecho: 'pecho',
  espalda: 'espalda',
  hombros: 'hombros',
  piernas: 'piernas',
  glúteos: 'gluteos',
  gluteos: 'gluteos',
};

const MUSCLE_LABEL_MAP: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  lats: 'Espalda',
  shoulders: 'Hombros',
  delts: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Piernas',
  quadriceps: 'Piernas',
  quads: 'Piernas',
  hamstrings: 'Piernas',
  calves: 'Piernas',
  glutes: 'Glúteos',
  core: 'Core',
  abs: 'Core',
  abdominals: 'Core',
  cardio: 'Cardio',
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  bíceps: 'Bíceps',
  tríceps: 'Tríceps',
  piernas: 'Piernas',
  glúteos: 'Glúteos',
  gluteos: 'Glúteos',
  core_es: 'Core',
};

const ABBREV_MAP: Record<string, string> = {
  pecho: 'Pe',
  espalda: 'Es',
  hombros: 'Ho',
  biceps: 'Bí',
  triceps: 'Tr',
  piernas: 'Pi',
  gluteos: 'Gl',
  core: 'Co',
  cardio: 'Ca',
};

const CIRCLE_COLOR_MAP: Record<string, string> = {
  pecho: '#3b82f6',
  espalda: '#8b5cf6',
  hombros: '#f59e0b',
  biceps: '#10b981',
  triceps: '#14b8a6',
  piernas: '#ef4444',
  gluteos: '#ec4899',
  core: '#f97316',
  cardio: '#06b6d4',
};

const DIFFICULTY_CONFIG = {
  BEGINNER: { label: 'Básico', bg: '#dcfce7', text: '#15803d' },
  INTERMEDIATE: { label: 'Medio', bg: '#fef3c7', text: '#b45309' },
  ADVANCED: { label: 'Avanzado', bg: '#fee2e2', text: '#b91c1c' },
};

function getMuscleKey(raw?: string): string {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase().trim();
  return MUSCLE_GROUP_MAP[lower] ?? 'unknown';
}

function getMuscleLabel(raw?: string): string {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();
  return MUSCLE_LABEL_MAP[lower] ?? raw;
}

function getMuscleAbbrev(key: string): string {
  return ABBREV_MAP[key] ?? '??';
}

function getMuscleColor(key: string): string {
  return CIRCLE_COLOR_MAP[key] ?? '#9ca3af';
}

interface ExerciseCardProps {
  exercise: Exercise;
}

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [frameIdx, setFrameIdx] = useState(0);
  const primaryMuscle = exercise.muscle_groups?.[0];
  const muscleKey = getMuscleKey(primaryMuscle);
  const muscleLabel = getMuscleLabel(primaryMuscle);
  const abbrev = getMuscleAbbrev(muscleKey);
  const circleColor = getMuscleColor(muscleKey);
  const diffConfig = exercise.difficulty ? DIFFICULTY_CONFIG[exercise.difficulty] : null;

  const firstEquipment = exercise.equipment?.[0];
  const equipmentText = firstEquipment
    ? firstEquipment.charAt(0).toUpperCase() + firstEquipment.slice(1).toLowerCase()
    : null;

  const subtitleParts = [muscleLabel, equipmentText].filter(Boolean);

  // Animación 2-frame: si hay 2+ imágenes, alternar cada 800ms simula el movimiento
  const images = exercise.image_urls ?? [];
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setFrameIdx((i) => (i + 1) % images.length), 800);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/exercise/${exercise.id}` as never)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        {images.length > 0 ? (
          <View style={[styles.muscleCircle, styles.thumbWrap]}>
            <Image source={{ uri: images[frameIdx] }} style={styles.thumb} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.muscleCircle, { backgroundColor: circleColor }]}>
            <Text style={styles.muscleAbbrev}>{abbrev}</Text>
          </View>
        )}

        <View style={styles.cardCenter}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {exercise.name}
          </Text>
          {subtitleParts.length > 0 && (
            <Text style={styles.exerciseSubtitle} numberOfLines={1}>
              {subtitleParts.join(' · ')}
            </Text>
          )}
        </View>

        {diffConfig && (
          <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg }]}>
            <Text style={[styles.diffText, { color: diffConfig.text }]}>{diffConfig.label}</Text>
          </View>
        )}

        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ExercisesScreen() {
  const { accessToken } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedChip, setSelectedChip] = useState('all');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchExercises = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await exercisesApi.list(accessToken ?? '');
        setExercises(Array.isArray(data) ? data : []);
      } catch {
        setExercises([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      debouncedSearch.trim() === '' ||
      ex.name.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesChip =
      selectedChip === 'all' || getMuscleKey(ex.muscle_groups?.[0]) === selectedChip;

    return matchesSearch && matchesChip;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ejercicios</Text>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{filteredExercises.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicios..."
          placeholderTextColor="#9ca3af"
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Muscle Group Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {MUSCLE_GROUP_CHIPS.map((chip) => {
          const isActive = selectedChip === chip.value;
          return (
            <TouchableOpacity
              key={chip.value}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => setSelectedChip(chip.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExerciseCard exercise={item} />}
          contentContainerStyle={
            filteredExercises.length === 0 ? styles.flatListEmpty : styles.flatListContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchExercises(true)}
              tintColor="#1d4ed8"
              colors={['#1d4ed8']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💪</Text>
              <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    minWidth: 70,
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
    flex: 1,
    textAlign: 'center',
  },
  countContainer: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },

  // Chips
  chipsScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 0,
  },
  chipActive: {
    backgroundColor: '#1d4ed8',
  },
  chipInactive: {
    backgroundColor: '#f3f4f6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  chipTextInactive: {
    color: '#374151',
  },

  // List
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 4,
  },
  flatListEmpty: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  thumbWrap: {
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chevron: {
    fontSize: 22,
    color: '#9ca3af',
    fontWeight: '400',
    marginLeft: 4,
  },
  bigFrameWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bigFrame: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  frameHint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  videoBtn: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  videoBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  muscleAbbrev: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardCenter: {
    flex: 1,
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  exerciseSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Expanded
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  expandedSection: {
    marginBottom: 10,
  },
  expandedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  expandedBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  secondaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  secondaryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  secondaryChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});
