-- Saldo de crédito en cuenta del miembro
ALTER TABLE "members"
  ADD COLUMN "credit_balance_usd" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Tabla de transacciones de crédito
CREATE TABLE "member_credit_transactions" (
  "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"              UUID NOT NULL,
  "member_id"           UUID NOT NULL,
  "kind"                VARCHAR(20) NOT NULL,
  "amount_usd"          DECIMAL(10,2) NOT NULL,
  "balance_after"       DECIMAL(10,2) NOT NULL,
  "related_order_id"    UUID,
  "note"                TEXT,
  "created_by_staff_id" UUID,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "member_credit_transactions_member_id_created_at_idx"
  ON "member_credit_transactions"("member_id", "created_at" DESC);

CREATE INDEX "member_credit_transactions_gym_id_created_at_idx"
  ON "member_credit_transactions"("gym_id", "created_at" DESC);

ALTER TABLE "member_credit_transactions"
  ADD CONSTRAINT "member_credit_transactions_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
