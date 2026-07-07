-- CreateTable
CREATE TABLE "lab_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "uploaded_by" UUID,
    "document_url" TEXT NOT NULL,
    "lab_date" DATE,
    "extracted_markers" JSONB,
    "ai_note" TEXT,
    "reviewed_by_nutritionist" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "nutritionist_notes" TEXT,
    "plan_adjusted_as_result" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_results_gym_id_member_id_created_at_idx" ON "lab_results"("gym_id", "member_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lab_results_gym_id_reviewed_by_nutritionist_idx" ON "lab_results"("gym_id", "reviewed_by_nutritionist");

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
