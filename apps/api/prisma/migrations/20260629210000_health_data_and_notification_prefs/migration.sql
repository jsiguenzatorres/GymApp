-- HealthDataEntry: registro de peso, agua, sueño, pasos
CREATE TABLE "health_data_entries" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "member_id"   UUID NOT NULL,
  "kind"        VARCHAR(20) NOT NULL,
  "value"       DECIMAL(10,2) NOT NULL,
  "unit"        VARCHAR(10) NOT NULL,
  "recorded_at" TIMESTAMP(3) NOT NULL,
  "source"      VARCHAR(20) NOT NULL DEFAULT 'manual',
  "notes"       TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_data_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "health_data_entries_member_id_kind_recorded_at_idx"
  ON "health_data_entries"("member_id", "kind", "recorded_at" DESC);

ALTER TABLE "health_data_entries"
  ADD CONSTRAINT "health_data_entries_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NotificationPreference: preferencias de recordatorios
CREATE TABLE "notification_preferences" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "member_id"   UUID NOT NULL,
  "kind"        VARCHAR(30) NOT NULL,
  "enabled"     BOOLEAN NOT NULL DEFAULT true,
  "time_of_day" VARCHAR(5),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_preferences_member_id_kind_key"
  ON "notification_preferences"("member_id", "kind");

ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
