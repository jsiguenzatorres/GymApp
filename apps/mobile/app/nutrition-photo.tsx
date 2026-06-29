import { useState } from 'react';
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, nutritionApi, PhotoAnalyzeResponse, PhotoAnalyzeItem } from '@/lib/api-client';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function detectMealType(): 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' {
  const h = new Date().getHours();
  if (h < 11) return 'BREAKFAST';
  if (h < 16) return 'LUNCH';
  if (h < 20) return 'DINNER';
  return 'SNACK';
}

export default function NutritionPhotoScreen() {
  const { accessToken } = useAuthStore();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalyzeResponse | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setPhotoFromAsset(res.assets[0]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setPhotoFromAsset(res.assets[0]);
  };

  const setPhotoFromAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) return;
    setPhotoUri(asset.uri);
    setPhotoBase64(asset.base64);
    setPhotoMime(asset.mimeType ?? 'image/jpeg');
    setResult(null);
    setSavedIdxs(new Set());
  };

  const analyze = async () => {
    if (!accessToken || !photoBase64) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const dataUri = `data:${photoMime};base64,${photoBase64}`;
      const res = await nutritionApi.analyzePhoto(accessToken, dataUri);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al analizar';
      Alert.alert('Error', msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const registerItem = async (item: PhotoAnalyzeItem, idx: number) => {
    if (!accessToken) return;
    const me = await memberApi.getMe(accessToken).catch(() => null);
    if (!me) return;

    setSavingIdx(idx);
    try {
      // 1) Reusar food_item existente que matchee el nombre identificado
      const food = await nutritionApi.searchFoodItems(accessToken, item.name).catch(() => []);
      let foodId = food.find((f) => f.name.toLowerCase() === item.name.toLowerCase())?.id;
      if (!foodId) {
        // No hay endpoint público para crear food-item desde miembro — usamos uno "ad-hoc" buscando aproximado
        const fallback = food[0];
        if (fallback) {
          foodId = fallback.id;
        } else {
          Alert.alert(
            'Alimento no encontrado',
            `"${item.name}" no está en la base. Pídele al admin que lo registre primero.`,
          );
          setSavingIdx(null);
          return;
        }
      }

      await nutritionApi.logFood(accessToken, me.id, {
        food_item_id: foodId,
        date: todayString(),
        meal_type: detectMealType(),
        quantity_g: item.grams,
        notes: `Identificado por IA · estimado: ${Math.round(item.kcal)} kcal`,
      });
      setSavedIdxs((prev) => new Set(prev).add(idx));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setSavingIdx(null);
    }
  };

  const registerAll = async () => {
    if (!result?.items.length) return;
    for (let i = 0; i < result.items.length; i++) {
      if (!savedIdxs.has(i)) {
        await registerItem(result.items[i], i);
      }
    }
    Alert.alert('Listo', 'Todos los alimentos identificados quedaron en tu diario de hoy.');
  };

  const reset = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setResult(null);
    setSavedIdxs(new Set());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📷 Foto del plato</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!photoUri ? (
          <View style={styles.intro}>
            <Text style={styles.introEmoji}>🍽️</Text>
            <Text style={styles.introTitle}>Identifica tu comida con IA</Text>
            <Text style={styles.introDesc}>
              Toma o elige una foto de lo que estás por comer. Nuestra IA identifica los alimentos,
              estima la porción y calcula kcal y macros — sin teclear nada.
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.bigBtnPrimary} onPress={takePhoto}>
                <Text style={styles.bigBtnEmoji}>📷</Text>
                <Text style={styles.bigBtnText}>Tomar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bigBtnSecondary} onPress={pickFromGallery}>
                <Text style={styles.bigBtnEmoji}>🖼️</Text>
                <Text style={styles.bigBtnTextSecondary}>Galería</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tipText}>
              💡 Mejor con iluminación natural · foto de cerca · plato completo visible
            </Text>
          </View>
        ) : (
          <>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            {!result ? (
              <View style={styles.analyzeRow}>
                <TouchableOpacity
                  style={[styles.analyzeBtn, analyzing && { opacity: 0.5 }]}
                  onPress={analyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.analyzeBtnText}>🔍 Analizar con IA</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={reset} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Cambiar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Resumen IA */}
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>Análisis</Text>
                    <View
                      style={[
                        styles.confChip,
                        result.confidence === 'high'
                          ? { backgroundColor: '#dcfce7' }
                          : result.confidence === 'medium'
                            ? { backgroundColor: '#fef3c7' }
                            : { backgroundColor: '#fee2e2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confText,
                          result.confidence === 'high'
                            ? { color: '#15803d' }
                            : result.confidence === 'medium'
                              ? { color: '#b45309' }
                              : { color: '#b91c1c' },
                        ]}
                      >
                        Confianza {result.confidence}
                      </Text>
                    </View>
                  </View>
                  {result.note && <Text style={styles.resultNote}>{result.note}</Text>}
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsKcal}>{Math.round(result.totals.kcal)} kcal</Text>
                    <Text style={styles.totalsMacros}>
                      P{Math.round(result.totals.protein_g)}g · C{Math.round(result.totals.carbs_g)}
                      g · G{Math.round(result.totals.fat_g)}g
                    </Text>
                  </View>
                </View>

                {/* Items identificados */}
                {result.items.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>🤔</Text>
                    <Text style={styles.emptyText}>
                      La IA no pudo identificar alimentos claros. Intenta otra foto.
                    </Text>
                  </View>
                ) : (
                  <>
                    {result.items.map((item, idx) => {
                      const saved = savedIdxs.has(idx);
                      return (
                        <View key={idx} style={styles.itemCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemMeta}>
                              ~{Math.round(item.grams)}g · {Math.round(item.kcal)} kcal
                            </Text>
                            <Text style={styles.itemMacros}>
                              P{Math.round(item.protein_g)} · C{Math.round(item.carbs_g)} · G
                              {Math.round(item.fat_g)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.itemBtn,
                              saved && styles.itemBtnSaved,
                              savingIdx === idx && { opacity: 0.6 },
                            ]}
                            onPress={() => registerItem(item, idx)}
                            disabled={saved || savingIdx === idx}
                          >
                            {savingIdx === idx ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <Text style={styles.itemBtnText}>
                                {saved ? '✓ Guardado' : '+ Diario'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    <TouchableOpacity style={styles.allBtn} onPress={registerAll}>
                      <Text style={styles.allBtnText}>Registrar todo al diario</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity onPress={reset} style={styles.changeBtnFull}>
                  <Text style={styles.changeBtnText}>Tomar otra foto</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
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
  scroll: { padding: 16, gap: 14 },
  intro: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  introEmoji: { fontSize: 64 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  introDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 19,
  },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16, alignSelf: 'stretch' },
  bigBtnPrimary: {
    flex: 1,
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  bigBtnSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  bigBtnEmoji: { fontSize: 26 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bigBtnTextSecondary: { color: '#111827', fontWeight: '700', fontSize: 13 },
  tipText: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 16 },

  photo: { width: '100%', height: 280, borderRadius: 14, backgroundColor: '#000' },
  analyzeRow: { gap: 10 },
  analyzeBtn: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  analyzeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  changeBtn: { paddingVertical: 10, alignItems: 'center' },
  changeBtnFull: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
  },
  changeBtnText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },

  resultCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  confChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  confText: { fontSize: 11, fontWeight: '700' },
  resultNote: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  totalsRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  totalsKcal: { fontSize: 24, fontWeight: '800', color: '#1d4ed8' },
  totalsMacros: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemMeta: { fontSize: 12, color: '#1d4ed8', fontWeight: '600', marginTop: 2 },
  itemMacros: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  itemBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    minWidth: 88,
    alignItems: 'center',
  },
  itemBtnSaved: { backgroundColor: '#15803d' },
  itemBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  allBtn: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  allBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 8 },
});
