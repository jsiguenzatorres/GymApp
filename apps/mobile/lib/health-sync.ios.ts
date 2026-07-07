import type { HealthSyncModule, HealthSyncResult } from './health-sync.types';
import { healthDataApi, HealthKind } from './api-client';

// D-19 — Apple HealthKit via @kingstinct/react-native-healthkit@8.7.2.
// Fijado en 8.7.2 (no la última) porque las versiones 9+ migraron a Nitro
// Modules y requieren react-native>=0.79 / react>=19 — este proyecto está en
// react-native 0.76.9 / react 18.3.1. La 8.7.2 es la última versión pre-Nitro,
// sin ese requisito de peer deps.
//
// API verificada contra los tipos publicados de esa versión exacta
// (unpkg.com/@kingstinct/react-native-healthkit@8.7.2/lib/typescript/src/):
// isHealthDataAvailable() (sin "Async"), requestAuthorization(read, write?)
// —read va PRIMERO—, queryQuantitySamples/queryCategorySamples usan `from`
// (no `startDate`) y aceptan `unit` explícito.
//
// ⚠️ Aun así, esto no se probó en un iPhone real — no hay forma de hacerlo
// desde este entorno de desarrollo. Confirma en dispositivo antes de confiar
// en producción.

interface NormalizedEntry {
  kind: HealthKind;
  value: number;
  unit: string;
  recorded_at: string;
}

async function loadNativeModule() {
  return import('@kingstinct/react-native-healthkit');
}

const WEIGHT_ID = 'HKQuantityTypeIdentifierBodyMass';
const WATER_ID = 'HKQuantityTypeIdentifierDietaryWater';
const SLEEP_ID = 'HKCategoryTypeIdentifierSleepAnalysis';

async function readRecentSamples(sinceDate: Date): Promise<NormalizedEntry[]> {
  const HealthKit = await loadNativeModule();
  const entries: NormalizedEntry[] = [];

  const weightSamples = await HealthKit.queryQuantitySamples(WEIGHT_ID, {
    from: sinceDate,
    unit: 'kg',
    limit: 500,
  });
  for (const s of weightSamples) {
    entries.push({
      kind: 'WEIGHT',
      value: s.quantity,
      unit: 'kg',
      recorded_at: new Date(s.startDate).toISOString(),
    });
  }

  const waterSamples = await HealthKit.queryQuantitySamples(WATER_ID, {
    from: sinceDate,
    unit: 'ml',
    limit: 500,
  });
  for (const s of waterSamples) {
    entries.push({
      kind: 'WATER',
      value: Math.round(s.quantity),
      unit: 'ml',
      recorded_at: new Date(s.startDate).toISOString(),
    });
  }

  const sleepSamples = await HealthKit.queryCategorySamples(SLEEP_ID, {
    from: sinceDate,
    limit: 500,
  });
  for (const s of sleepSamples) {
    const minutes = Math.round(
      (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000,
    );
    if (minutes <= 0) continue;
    entries.push({
      kind: 'SLEEP',
      value: minutes,
      unit: 'min',
      recorded_at: new Date(s.startDate).toISOString(),
    });
  }

  return entries;
}

const healthSync: HealthSyncModule = {
  platformLabel: 'Apple Health',

  async isAvailable() {
    try {
      const HealthKit = await loadNativeModule();
      return await HealthKit.isHealthDataAvailable();
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    try {
      const HealthKit = await loadNativeModule();
      // read va primero, write (vacío — solo leemos) va segundo
      await HealthKit.requestAuthorization([WEIGHT_ID, WATER_ID, SLEEP_ID], []);
      return true;
    } catch {
      return false;
    }
  },

  async syncNow(accessToken: string, sinceDate: Date): Promise<HealthSyncResult> {
    const entries = await readRecentSamples(sinceDate);
    if (entries.length === 0) return { imported: 0, total: 0 };
    const res = await healthDataApi.bulkImport(accessToken, { source: 'apple_health', entries });
    return { imported: res.imported, total: res.total };
  },
};

export default healthSync;
