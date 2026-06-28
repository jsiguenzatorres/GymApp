-- Plan Fundadores: campos en gyms + tabla singleton de configuración

-- AlterTable: campos en gyms para tracking del Plan Fundador asignado
ALTER TABLE "gyms"
  ADD COLUMN "is_founder" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "founder_plan_type" "SaasPlan",
  ADD COLUMN "founder_locked_price" DECIMAL(10,2),
  ADD COLUMN "founder_locked_at" TIMESTAMP(3);

-- CreateTable: configuración singleton de la oferta (key='default' único)
CREATE TABLE "founder_offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(50) NOT NULL DEFAULT 'default',
    "total_slots" INTEGER NOT NULL DEFAULT 50,
    "starter_price" DECIMAL(10,2) NOT NULL DEFAULT 59.00,
    "pro_price" DECIMAL(10,2) NOT NULL DEFAULT 99.00,
    "elite_price" DECIMAL(10,2) NOT NULL DEFAULT 199.00,
    "regular_starter_price" DECIMAL(10,2) NOT NULL DEFAULT 79.00,
    "regular_pro_price" DECIMAL(10,2) NOT NULL DEFAULT 149.00,
    "regular_elite_price" DECIMAL(10,2) NOT NULL DEFAULT 299.00,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deadline_at" TIMESTAMP(3),
    "free_months" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "founder_offers_key_key" ON "founder_offers"("key");

-- Seed inicial: insertar la fila singleton con defaults
INSERT INTO "founder_offers" ("key", "updated_at") VALUES ('default', CURRENT_TIMESTAMP);
