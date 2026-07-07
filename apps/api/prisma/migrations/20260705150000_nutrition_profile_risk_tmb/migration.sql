-- AlterTable
ALTER TABLE "nutrition_plans" ADD COLUMN     "factor_actividad" DECIMAL(3,2),
ADD COLUMN     "tdee_kcal" DECIMAL(7,2),
ADD COLUMN     "tmb_formula_used" VARCHAR(30),
ADD COLUMN     "tmb_kcal" DECIMAL(7,2);

-- CreateTable
CREATE TABLE "member_nutrition_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "dieta_base" VARCHAR(30) NOT NULL DEFAULT 'omnivoro',
    "alergias" TEXT[],
    "intolerancias" TEXT[],
    "restricciones_religiosas" VARCHAR(30),
    "alimentos_evitar" TEXT[],
    "alimentos_favoritos" TEXT[],
    "presupuesto" VARCHAR(20) NOT NULL DEFAULT 'medio',
    "tiempo_cocina" VARCHAR(20),
    "height_cm" DOUBLE PRECISION,
    "activity_level" VARCHAR(20),
    "condiciones_medicas" TEXT[],
    "requiere_supervision_clinica" BOOLEAN NOT NULL DEFAULT false,
    "antecedente_tca_declarado" BOOLEAN NOT NULL DEFAULT false,
    "tca_clinical_review_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_nutrition_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_risk_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "pattern_detected" VARCHAR(50) NOT NULL,
    "detection_details" JSONB NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_risk_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_nutrition_profiles_member_id_key" ON "member_nutrition_profiles"("member_id");

-- CreateIndex
CREATE INDEX "member_nutrition_profiles_gym_id_idx" ON "member_nutrition_profiles"("gym_id");

-- CreateIndex
CREATE INDEX "nutrition_risk_alerts_gym_id_reviewed_idx" ON "nutrition_risk_alerts"("gym_id", "reviewed");

-- CreateIndex
CREATE INDEX "nutrition_risk_alerts_member_id_pattern_detected_created_at_idx" ON "nutrition_risk_alerts"("member_id", "pattern_detected", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "member_nutrition_profiles" ADD CONSTRAINT "member_nutrition_profiles_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_nutrition_profiles" ADD CONSTRAINT "member_nutrition_profiles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_risk_alerts" ADD CONSTRAINT "nutrition_risk_alerts_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_risk_alerts" ADD CONSTRAINT "nutrition_risk_alerts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
