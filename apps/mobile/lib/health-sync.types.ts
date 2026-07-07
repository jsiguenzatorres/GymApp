// D-19: contrato compartido entre health-sync.ios.ts y health-sync.android.ts.
// Metro resuelve el archivo correcto por plataforma automáticamente al importar
// './health-sync' (sin extensión) — este archivo (sin sufijo) es el fallback
// para plataformas sin soporte (ej. web).

export interface HealthSyncResult {
  imported: number;
  total: number;
}

export interface HealthSyncModule {
  /** "Apple Health" | "Health Connect" — para mostrar en la UI */
  platformLabel: string;
  isAvailable(): Promise<boolean>;
  /** true si el usuario concedió los permisos de lectura (peso, agua, sueño) */
  requestPermissions(): Promise<boolean>;
  /** Lee datos nuevos desde `sinceDate` y los sube via bulk-import */
  syncNow(accessToken: string, sinceDate: Date): Promise<HealthSyncResult>;
}
