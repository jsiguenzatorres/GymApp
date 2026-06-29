CREATE TABLE "billing_subscriptions" (
  "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"               UUID NOT NULL,
  "member_id"            UUID NOT NULL,
  "membership_type_id"   UUID NOT NULL,
  "provider"             VARCHAR(20) NOT NULL,
  "external_id"          VARCHAR(200),
  "external_customer_id" VARCHAR(200),
  "status"               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "amount_usd"           DECIMAL(10,2) NOT NULL,
  "interval"             VARCHAR(20) NOT NULL DEFAULT 'month',
  "current_period_start" TIMESTAMP(3),
  "current_period_end"   TIMESTAMP(3),
  "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
  "metadata"             JSONB,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "billing_subscriptions_gym_id_status_idx" ON "billing_subscriptions"("gym_id", "status");
CREATE INDEX "billing_subscriptions_member_id_idx" ON "billing_subscriptions"("member_id");
CREATE UNIQUE INDEX "billing_subscriptions_provider_external_id_key"
  ON "billing_subscriptions"("provider", "external_id");

CREATE TABLE "billing_webhook_events" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider"     VARCHAR(20) NOT NULL,
  "event_type"   VARCHAR(100) NOT NULL,
  "external_id"  VARCHAR(200) NOT NULL,
  "payload"      JSONB NOT NULL,
  "processed"    BOOLEAN NOT NULL DEFAULT false,
  "processed_at" TIMESTAMP(3),
  "error"        TEXT,
  "received_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_webhook_events_external_id_key" ON "billing_webhook_events"("external_id");
CREATE INDEX "billing_webhook_events_provider_processed_received_at_idx"
  ON "billing_webhook_events"("provider", "processed", "received_at" DESC);
