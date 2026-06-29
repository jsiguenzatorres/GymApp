import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useAuthStore } from '@/store/auth.store';
import { memberApi, nutritionApi, FoodItem } from '@/lib/api-client';

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

export default function NutritionBarcodeScreen() {
  const { accessToken } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [foundItem, setFoundItem] = useState<FoodItem | null>(null);
  const [notFound, setNotFound] = useState<{ code: string; reason: string } | null>(null);
  const [quantityG, setQuantityG] = useState('100');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleScan = async (result: BarcodeScanningResult) => {
    if (scanned || !accessToken) return;
    setScanned(result.data);
    setLoading(true);
    setFoundItem(null);
    setNotFound(null);
    try {
      const res = await nutritionApi.findByBarcode(accessToken, result.data);
      if (res.found && res.item) {
        setFoundItem(res.item);
      } else {
        setNotFound({ code: result.data, reason: res.error ?? 'Producto no encontrado' });
      }
    } catch (err) {
      setNotFound({
        code: result.data,
        reason: err instanceof Error ? err.message : 'Error de red',
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScanned(null);
    setFoundItem(null);
    setNotFound(null);
    setQuantityG('100');
    setSaved(false);
  };

  const register = async () => {
    if (!accessToken || !foundItem) return;
    const qty = parseFloat(quantityG);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Cantidad inválida', 'Indica gramos > 0');
      return;
    }
    setSaving(true);
    try {
      const me = await memberApi.getMe(accessToken);
      await nutritionApi.logFood(accessToken, me.id, {
        food_item_id: foundItem.id,
        date: todayString(),
        meal_type: detectMealType(),
        quantity_g: qty,
        notes: `Escaneado: ${foundItem.barcode ?? 'sin código'}`,
      });
      setSaved(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📷 Escanear código</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.permCard}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>Permiso de cámara requerido</Text>
          <Text style={styles.permDesc}>
            Necesitamos acceso a la cámara para escanear el código de barras de tus productos.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir acceso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📷 Escanear código</Text>
        <View style={styles.headerBtn} />
      </View>

      {!scanned ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={handleScan}
          />
          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Apunta al código de barras del producto</Text>
          </View>
        </View>
      ) : (
        <View style={styles.resultPane}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#1d4ed8" />
              <Text style={styles.loadingText}>Buscando código {scanned}…</Text>
            </View>
          ) : foundItem ? (
            <>
              <View style={styles.foundCard}>
                <Text style={styles.foundEmoji}>✓</Text>
                <Text style={styles.foundName}>{foundItem.name}</Text>
                {foundItem.brand && <Text style={styles.foundBrand}>{foundItem.brand}</Text>}
                <Text style={styles.foundCode}>Código: {scanned}</Text>
                <View style={styles.macroBox}>
                  <Text style={styles.macroKcal}>{Math.round(foundItem.kcal_per_100g)} kcal</Text>
                  <Text style={styles.macroSub}>
                    P{foundItem.protein_per_100g.toFixed(1)} · C
                    {foundItem.carbs_per_100g.toFixed(1)} · G{foundItem.fat_per_100g.toFixed(1)}{' '}
                    (por 100g)
                  </Text>
                </View>
              </View>

              {saved ? (
                <View style={styles.savedCard}>
                  <Text style={styles.savedEmoji}>🎉</Text>
                  <Text style={styles.savedText}>Registrado en tu diario de hoy</Text>
                  <TouchableOpacity style={styles.againBtn} onPress={reset}>
                    <Text style={styles.againBtnText}>Escanear otro</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Cantidad consumida (g)</Text>
                  <TextInput
                    value={quantityG}
                    onChangeText={setQuantityG}
                    keyboardType="numeric"
                    style={styles.qtyInput}
                  />

                  {(() => {
                    const qty = parseFloat(quantityG) || 0;
                    const factor = qty / 100;
                    return (
                      <View style={styles.previewBox}>
                        <Text style={styles.previewText}>
                          Aporta:{' '}
                          <Text style={styles.previewBig}>
                            {Math.round(foundItem.kcal_per_100g * factor)} kcal
                          </Text>
                          {'\n'}P{(foundItem.protein_per_100g * factor).toFixed(1)}g · C
                          {(foundItem.carbs_per_100g * factor).toFixed(1)}g · G
                          {(foundItem.fat_per_100g * factor).toFixed(1)}g
                        </Text>
                      </View>
                    );
                  })()}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.changeBtn} onPress={reset}>
                      <Text style={styles.changeBtnText}>Escanear otro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.registerBtn, saving && { opacity: 0.5 }]}
                      onPress={register}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.registerBtnText}>+ Registrar al diario</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.notFoundCard}>
              <Text style={styles.notFoundEmoji}>🤷</Text>
              <Text style={styles.notFoundTitle}>Producto no encontrado</Text>
              <Text style={styles.notFoundCode}>Código: {notFound?.code}</Text>
              <Text style={styles.notFoundReason}>{notFound?.reason}</Text>
              <Text style={styles.notFoundTip}>
                Probamos en OpenFoodFacts (base mundial de productos) y no apareció. Puedes
                registrarlo manual desde el botón "+ Registrar".
              </Text>
              <TouchableOpacity style={styles.againBtn} onPress={reset}>
                <Text style={styles.againBtnText}>Escanear otro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
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

  cameraWrap: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },

  resultPane: { flex: 1, backgroundColor: '#f9fafb', padding: 16, gap: 12 },
  loadingText: { fontSize: 13, color: '#6b7280', marginTop: 10 },

  foundCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center' },
  foundEmoji: { fontSize: 36, color: '#15803d' },
  foundName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginTop: 4,
  },
  foundBrand: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  foundCode: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  macroBox: { alignItems: 'center', marginTop: 12 },
  macroKcal: { fontSize: 26, fontWeight: '800', color: '#1d4ed8' },
  macroSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  label: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qtyInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  previewBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10 },
  previewText: { fontSize: 12, color: '#78350f', lineHeight: 18 },
  previewBig: { fontSize: 14, fontWeight: '800', color: '#b45309' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  changeBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  changeBtnText: { color: '#6b7280', fontWeight: '700' },
  registerBtn: {
    flex: 2,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  savedCard: { alignItems: 'center', backgroundColor: '#dcfce7', borderRadius: 14, padding: 24 },
  savedEmoji: { fontSize: 48 },
  savedText: { fontSize: 15, fontWeight: '700', color: '#15803d', marginTop: 6 },
  againBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  againBtnText: { color: '#fff', fontWeight: '700' },

  notFoundCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 24 },
  notFoundEmoji: { fontSize: 48 },
  notFoundTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginTop: 6 },
  notFoundCode: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  notFoundReason: { fontSize: 12, color: '#dc2626', marginTop: 4, fontStyle: 'italic' },
  notFoundTip: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 18,
  },

  permCard: { padding: 24, alignItems: 'center', gap: 8 },
  permEmoji: { fontSize: 48 },
  permTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  permDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 16 },
  permBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  permBtnText: { color: '#fff', fontWeight: '700' },
});
