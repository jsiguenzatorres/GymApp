-- Add-ons del miembro (suscripciones adicionales: NUTRITION, etc.)
CREATE TABLE "member_addons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "tier" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "price_paid" DECIMAL(8,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "assigned_by_staff_id" UUID,
    "cancellation_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_addons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "member_addons_member_id_type_status_idx"
  ON "member_addons"("member_id", "type", "status");

ALTER TABLE "member_addons"
  ADD CONSTRAINT "member_addons_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
