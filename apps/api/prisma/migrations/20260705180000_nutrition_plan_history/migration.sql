-- CreateTable
CREATE TABLE "nutrition_plan_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "nutrition_plan_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "goal" VARCHAR(30) NOT NULL,
    "kcal_target" INTEGER NOT NULL,
    "protein_g" INTEGER NOT NULL,
    "carbs_g" INTEGER NOT NULL,
    "fat_g" INTEGER NOT NULL,
    "notes" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_plan_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nutrition_plan_history_nutrition_plan_id_changed_at_idx" ON "nutrition_plan_history"("nutrition_plan_id", "changed_at" DESC);

-- AddForeignKey
ALTER TABLE "nutrition_plan_history" ADD CONSTRAINT "nutrition_plan_history_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plan_history" ADD CONSTRAINT "nutrition_plan_history_nutrition_plan_id_fkey" FOREIGN KEY ("nutrition_plan_id") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
