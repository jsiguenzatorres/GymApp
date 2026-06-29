import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, ProgressPhoto } from '@/lib/api-client';

const SCREEN_W = Dimensions.get('window').width;
const GRID_GAP = 8;
const GRID_COLS = 3;
const TILE = (SCREEN_W - 32 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const CATEGORY_LABEL: Record<string, string> = {
  FRONT: 'Frente',
  SIDE: 'Lado',
  BACK: 'Atrás',
  CUSTOM: 'Otra',
};

type Mode = 'gallery' | 'compare';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProgressPhotosScreen() {
  const { accessToken } = useAuthStore();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<Mode>('gallery');

  // Modal de vista única
  const [viewPhoto, setViewPhoto] = useState<ProgressPhoto | null>(null);

  // Modo comparar
  const [compareLeft, setCompareLeft] = useState<ProgressPhoto | null>(null);
  const [compareRight, setCompareRight] = useState<ProgressPhoto | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await memberApi.listMyProgressPhotos(accessToken);
      setPhotos(res);
      // Defaults para comparar: primera y última (más antigua y más nueva)
      if (res.length >= 2 && !compareLeft && !compareRight) {
        setCompareLeft(res[res.length - 1]); // más antigua
        setCompareRight(res[0]); // más nueva
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, compareLeft, compareRight]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleUpload = async () => {
    if (!accessToken || uploading) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    const dataUri = `data:${mime};base64,${asset.base64}`;

    setUploading(true);
    try {
      const newPhoto = await memberApi.uploadMyProgressPhoto(accessToken, {
        image: dataUri,
        category: 'FRONT',
      });
      setPhotos((prev) => [newPhoto, ...prev]);
      Alert.alert('¡Listo!', 'Foto añadida a tu progreso.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir la foto.';
      Alert.alert('Error', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (photo: ProgressPhoto) => {
    Alert.alert('Eliminar foto', '¿Borrar esta foto de tu progreso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!accessToken) return;
          try {
            await memberApi.deleteMyProgressPhoto(accessToken, photo.id);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            if (compareLeft?.id === photo.id) setCompareLeft(null);
            if (compareRight?.id === photo.id) setCompareRight(null);
            setViewPhoto(null);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la foto.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotos de progreso</Text>
        <TouchableOpacity onPress={handleUpload} style={styles.headerBtn} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#1d4ed8" />
          ) : (
            <Text style={styles.headerAddText}>+</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        {(['gallery', 'compare'] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'gallery' ? 'Galería' : 'Comparar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty state */}
      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyTitle}>Aún no tienes fotos</Text>
          <Text style={styles.emptySub}>
            Sube tu primera foto hoy. Toma una nueva cada 2-4 semanas para ver tu evolución.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleUpload}>
            <Text style={styles.emptyBtnText}>Subir primera foto</Text>
          </TouchableOpacity>
        </View>
      ) : mode === 'gallery' ? (
        // ─── GALLERY MODE ──────────────────────────────────────────────────
        <ScrollView
          contentContainerStyle={styles.gridScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
          }
        >
          <View style={styles.grid}>
            {photos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.tile}
                onPress={() => setViewPhoto(p)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: p.url }} style={styles.tileImg} />
                <View style={styles.tileBadge}>
                  <Text style={styles.tileBadgeText}>{formatDate(p.taken_at)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        // ─── COMPARE MODE ──────────────────────────────────────────────────
        <ScrollView contentContainerStyle={styles.compareScroll}>
          {photos.length < 2 ? (
            <Text style={styles.compareHint}>
              Sube al menos 2 fotos para poder comparar. Tienes {photos.length}.
            </Text>
          ) : (
            <>
              <View style={styles.compareRow}>
                <ComparePane
                  label="ANTES"
                  photo={compareLeft}
                  photos={photos}
                  onPick={setCompareLeft}
                />
                <ComparePane
                  label="DESPUÉS"
                  photo={compareRight}
                  photos={photos}
                  onPick={setCompareRight}
                />
              </View>
              {compareLeft && compareRight && (
                <Text style={styles.compareDelta}>
                  {Math.round(
                    (new Date(compareRight.taken_at).getTime() -
                      new Date(compareLeft.taken_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{' '}
                  días de diferencia
                </Text>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal vista única */}
      <Modal
        visible={viewPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewPhoto(null)}
      >
        {viewPhoto && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setViewPhoto(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Image source={{ uri: viewPhoto.url }} style={styles.modalImg} resizeMode="contain" />
            <View style={styles.modalFooter}>
              <View>
                <Text style={styles.modalDate}>{formatDate(viewPhoto.taken_at)}</Text>
                <Text style={styles.modalCategory}>
                  {CATEGORY_LABEL[viewPhoto.category] ?? viewPhoto.category}
                  {viewPhoto.weight_kg ? ` · ${viewPhoto.weight_kg} kg` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(viewPhoto)} style={styles.modalDelBtn}>
                <Text style={styles.modalDelText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ─── Compare Pane ────────────────────────────────────────────────────────────
function ComparePane({
  label,
  photo,
  photos,
  onPick,
}: {
  label: string;
  photo: ProgressPhoto | null;
  photos: ProgressPhoto[];
  onPick: (p: ProgressPhoto) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <View style={styles.comparePane}>
      <Text style={styles.compareLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.compareBigBtn}
        onPress={() => setPickerOpen(true)}
        activeOpacity={0.85}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo.url }} style={styles.compareImg} resizeMode="cover" />
            <View style={styles.compareDateBadge}>
              <Text style={styles.compareDateText}>{formatDate(photo.taken_at)}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.comparePlaceholder}>Tocar para elegir foto</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Elegir foto</Text>
            <ScrollView contentContainerStyle={styles.pickerGrid}>
              {photos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.pickerTile}
                  onPress={() => {
                    onPick(p);
                    setPickerOpen(false);
                  }}
                >
                  <Image source={{ uri: p.url }} style={styles.pickerImg} />
                  <Text style={styles.pickerDate}>{formatDate(p.taken_at)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.pickerCancel}>
              <Text style={styles.pickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 30, color: '#111827', fontWeight: '400' },
  headerAddText: { fontSize: 26, color: '#1d4ed8', fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#1d4ed8' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  modeBtnTextActive: { color: '#fff' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 10,
  },
  emptyBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Gallery
  gridScroll: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  tileImg: { width: '100%', height: '100%' },
  tileBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tileBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // Compare
  compareScroll: { padding: 16 },
  compareHint: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginTop: 40,
  },
  compareRow: { flexDirection: 'row', gap: 10 },
  comparePane: { flex: 1, gap: 8 },
  compareLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 1,
    textAlign: 'center',
  },
  compareBigBtn: {
    aspectRatio: 0.7,
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compareImg: { width: '100%', height: '100%' },
  comparePlaceholder: { color: '#6b7280', fontSize: 12, padding: 12, textAlign: 'center' },
  compareDateBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  compareDateText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  compareDelta: { textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 14 },

  // Picker modal
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  pickerTile: { width: '31%', gap: 4 },
  pickerImg: { width: '100%', aspectRatio: 0.7, borderRadius: 8, backgroundColor: '#e5e7eb' },
  pickerDate: { fontSize: 10, color: '#6b7280', textAlign: 'center' },
  pickerCancel: {
    marginTop: 12,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerCancelText: { color: '#374151', fontWeight: '600' },

  // Vista única modal
  modalOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  modalCloseText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  modalImg: { width: '100%', height: '70%' },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalDate: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCategory: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  modalDelBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  modalDelText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
