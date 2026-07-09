import type { HealthSyncModule, HealthSyncResult } from './health-sync.types';
import { healthDataApi, HealthKind } from './api-client';

// D-19 — Android Health Connect via react-native-health-connect@3.5.6.
// Los records de readRecords() devuelven Mass/Volume ya como *Result*
// (ej. { inKilograms, inGrams, ... }), con las conversiones de unidad ya
// resueltas por la librería — no hace falta convertir a mano.
//
// ⚠️ Aun así, esto no se probó en un dispositivo Android real — no hay forma
// de hacerlo desde este entorno de desarrollo. Confirma en dispositivo antes
// de confiar en producción.

interface NormalizedEntry {
  kind: HealthKind;
  value: number;
  unit: string;
  recorded_at: string;
}

async function loadNativeModule() {
  return import('react-native-health-connect');
}

async function readRecentRecords(sinceDate: Date): Promise<NormalizedEntry[]> {
  const HealthConnect = await loadNativeModule();
  const entries: NormalizedEntry[] = [];

  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: sinceDate.toISOString(),
    endTime: new Date().toISOString(),
  };

  const weightResult = await HealthConnect.readRecords('Weight', { timeRangeFilter });
  for (const r of weightResult.records) {
    entries.push({
      kind: 'WEIGHT',
      value: Number(r.weight.inKilograms.toFixed(2)),
      unit: 'kg',
      recorded_at: new Date(r.time).toISOString(),
    });
  }

  const hydrationResult = await HealthConnect.readRecords('Hydration', { timeRangeFilter });
  for (const r of hydrationResult.records) {
    entries.push({
      kind: 'WATER',
      value: Math.round(r.volume.inMilliliters),
      unit: 'ml',
      recorded_at: new Date(r.startTime).toISOString(),
    });
  }

  const sleepResult = await HealthConnect.readRecords('SleepSession', { timeRangeFilter });
  for (const r of sleepResult.records) {
    const minutes = Math.round(
      (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000,
    );
    if (minutes <= 0) continue;
    entries.push({
      kind: 'SLEEP',
      value: minutes,
      unit: 'min',
      recorded_at: new Date(r.startTime).toISOString(),
    });
  }

  return entries;
}

const healthSync: HealthSyncModule = {
  platformLabel: 'Health Connect',

  async isAvailable() {
    try {
      const HealthConnect = await loadNativeModule();
      return await HealthConnect.initialize();
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    try {
      const HealthConnect = await loadNativeModule();
      const granted = await HealthConnect.requestPermission([
        { accessType: 'read', recordType: 'Weight' },
        { accessType: 'read', recordType: 'Hydration' },
        { accessType: 'read', recordType: 'SleepSession' },
      ]);
      return granted.length > 0;
    } catch {
      return false;
    }
  },

  async syncNow(accessToken: string, sinceDate: Date): Promise<HealthSyncResult> {
    const entries = await readRecentRecords(sinceDate);
    if (entries.length === 0) return { imported: 0, total: 0 };
    // El schema de health_data_entries solo tiene 'google_fit' como opción Android
    // (no 'health_connect') — Health Connect es el sucesor de Google Fit en Android,
    // así que reusamos ese valor de source en vez de agregar un enum nuevo.
    const res = await healthDataApi.bulkImport(accessToken, { source: 'google_fit', entries });
    return { imported: res.imported, total: res.total };
  },
};

export default healthSync;
