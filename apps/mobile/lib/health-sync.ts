import type { HealthSyncModule } from './health-sync.types';

// Fallback para plataformas sin integración nativa (ej. web). Metro resuelve
// health-sync.ios.ts / health-sync.android.ts automáticamente en dispositivo.
const healthSync: HealthSyncModule = {
  platformLabel: 'Sincronización nativa',
  isAvailable: async () => false,
  requestPermissions: async () => false,
  syncNow: async () => ({ imported: 0, total: 0 }),
};

export default healthSync;
