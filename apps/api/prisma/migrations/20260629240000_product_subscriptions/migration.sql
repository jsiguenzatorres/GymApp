CREATE TABLE "product_subscriptions" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"            UUID NOT NULL,
  "member_id"         UUID NOT NULL,
  "product_id"        UUID NOT NULL,
  "quantity"          INTEGER NOT NULL DEFAULT 1,
  "frequency_days"    INTEGER NOT NULL,
  "status"            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "next_delivery_at"  TIMESTAMP(3) NOT NULL,
  "last_delivered_at" TIMESTAMP(3),
  "total_deliveries"  INTEGER NOT NULL DEFAULT 0,
  "notes"             TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_subscriptions_gym_id_status_next_delivery_at_idx"
  ON "product_subscriptions"("gym_id", "status", "next_delivery_at");

CREATE INDEX "product_subscriptions_member_id_status_idx"
  ON "product_subscriptions"("member_id", "status");

ALTER TABLE "product_subscriptions"
  ADD CONSTRAINT "product_subscriptions_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_subscriptions"
  ADD CONSTRAINT "product_subscriptions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE;
