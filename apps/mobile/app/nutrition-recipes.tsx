import { useState } from 'react';
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
import { nutritionApi, Recipe } from '@/lib/api-client';

const QUICK_INGREDIENTS = [
  '🍗 Pollo',
  '🥩 Res',
  '🍳 Huevo',
  '🍚 Arroz',
  '🫘 Frijoles',
  '🌽 Tortilla',
  '🍅 Tomate',
  '🥦 Brócoli',
  '🥑 Aguacate',
  '🧀 Queso',
  '🍌 Plátano',
  '🍠 Camote',
];

export default function NutritionRecipesScreen() {
  const { accessToken } = useAuthStore();
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const addIngredient = (raw?: string) => {
    const v = (raw ?? input).trim().replace(/^[^a-zA-ZáéíóúñÁÉÍÓÚÑ]+/, '');
    if (!v) return;
    if (ingredients.includes(v)) return;
    setIngredients((prev) => [...prev, v]);
    if (!raw) setInput('');
  };

  const removeIngredient = (i: string) => setIngredients((prev) => prev.filter((x) => x !== i));

  const generate = async () => {
    if (!accessToken || ingredients.length === 0) return;
    setLoading(true);
    setRecipe(null);
    try {
      const res = await nutritionApi.generateRecipe(
        accessToken,
        ingredients,
        preferences.trim() || undefined,
      );
      if (res.success && res.recipe) {
        setRecipe(res.recipe);
      } else {
        Alert.alert('Error', res.error ?? 'No se pudo generar la receta. Intenta de nuevo.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRecipe(null);
    setInput('');
    setIngredients([]);
    setPreferences('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍🍳 Recetas con IA</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!recipe ? (
            <>
              <View style={styles.intro}>
                <Text style={styles.introTitle}>¿Qué tienes en la cocina?</Text>
                <Text style={styles.introDesc}>
                  Agrega los ingredientes que tienes y la IA te genera una receta personalizada con
                  macros calculadas.
                </Text>
              </View>

              {/* Input + botón add */}
              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ej: lentejas, espinaca, atún…"
                  style={styles.textInput}
                  onSubmitEditing={() => addIngredient()}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={() => addIngredient()}>
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Quick chips */}
              <Text style={styles.label}>Rápidos</Text>
              <View style={styles.quickRow}>
                {QUICK_INGREDIENTS.map((q) => {
                  const name = q.replace(/^[^\sa-zA-ZáéíóúñÁÉÍÓÚÑ]+\s*/, '');
                  const already = ingredients.includes(name);
                  return (
                    <TouchableOpacity
                      key={q}
                      style={[styles.quickChip, already && styles.quickChipDisabled]}
                      onPress={() => !already && addIngredient(name)}
                      disabled={already}
                    >
                      <Text style={styles.quickChipText}>{q}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Lista de ingredientes elegidos */}
              {ingredients.length > 0 && (
                <>
                  <Text style={styles.label}>Tus ingredientes ({ingredients.length})</Text>
                  <View style={styles.selectedRow}>
                    {ingredients.map((i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.selectedChip}
                        onPress={() => removeIngredient(i)}
                      >
                        <Text style={styles.selectedChipText}>{i} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Preferencias */}
              <Text style={styles.label}>Preferencias (opcional)</Text>
              <TextInput
                value={preferences}
                onChangeText={setPreferences}
                placeholder="Ej: sin lactosa, alto en proteína, vegetariano…"
                style={styles.prefInput}
                multiline
              />

              <TouchableOpacity
                style={[styles.generateBtn, ingredients.length === 0 && { opacity: 0.4 }]}
                onPress={generate}
                disabled={ingredients.length === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateBtnText}>✨ Generar receta</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Receta generada */}
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeDesc}>{recipe.description}</Text>
                <View style={styles.recipeMeta}>
                  <Text style={styles.metaItem}>
                    🍽️ {recipe.servings} porción{recipe.servings === 1 ? '' : 'es'}
                  </Text>
                  <Text style={styles.metaItem}>
                    ⏱️ {recipe.prep_time_min}+{recipe.cook_time_min}min
                  </Text>
                </View>
              </View>

              {/* Macros */}
              <View style={styles.macrosCard}>
                <Text style={styles.macrosLabel}>Por porción</Text>
                <Text style={styles.macrosKcal}>
                  {Math.round(recipe.macros_per_serving.kcal)} kcal
                </Text>
                <Text style={styles.macrosDetail}>
                  P{Math.round(recipe.macros_per_serving.protein_g)}g · C
                  {Math.round(recipe.macros_per_serving.carbs_g)}g · G
                  {Math.round(recipe.macros_per_serving.fat_g)}g
                </Text>
              </View>

              {/* Ingredientes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredientes</Text>
                {recipe.ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingRow}>
                    <Text style={styles.ingQty}>{ing.quantity}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>{ing.name}</Text>
                      {ing.notes && <Text style={styles.ingNotes}>{ing.notes}</Text>}
                    </View>
                  </View>
                ))}
              </View>

              {/* Pasos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pasos</Text>
                {recipe.steps.map((s, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Tips */}
              {recipe.tips?.length > 0 && (
                <View style={styles.tipsCard}>
                  <Text style={styles.sectionTitle}>💡 Tips del chef</Text>
                  {recipe.tips.map((t, idx) => (
                    <Text key={idx} style={styles.tipItem}>
                      • {t}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.againBtn} onPress={reset}>
                <Text style={styles.againBtnText}>Generar otra receta</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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

  intro: { paddingVertical: 8, gap: 4 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  introDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19 },

  label: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },

  inputRow: { flexDirection: 'row', gap: 8 },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  addBtn: {
    width: 44,
    backgroundColor: '#15803d',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '800' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickChipDisabled: { opacity: 0.35 },
  quickChipText: { fontSize: 12, color: '#374151' },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 100,
  },
  selectedChipText: { fontSize: 12, color: '#15803d', fontWeight: '700' },

  prefInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 60,
  },

  generateBtn: {
    backgroundColor: '#b45309',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  generateBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  recipeHeader: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  recipeTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  recipeDesc: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 19 },
  recipeMeta: { flexDirection: 'row', gap: 14, marginTop: 8 },
  metaItem: { fontSize: 12, color: '#374151', fontWeight: '600' },

  macrosCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  macrosLabel: { color: '#bfdbfe', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  macrosKcal: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  macrosDetail: { color: '#dbeafe', fontSize: 13, fontWeight: '600' },

  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  ingRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  ingQty: { fontSize: 13, fontWeight: '700', color: '#1d4ed8', minWidth: 70 },
  ingName: { fontSize: 13, color: '#111827' },
  ingNotes: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },

  stepRow: { flexDirection: 'row', gap: 10, marginVertical: 6 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19, paddingTop: 4 },

  tipsCard: { backgroundColor: '#fef3c7', borderRadius: 14, padding: 16 },
  tipItem: { fontSize: 12, color: '#78350f', marginVertical: 2, lineHeight: 18 },

  againBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  againBtnText: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
});
