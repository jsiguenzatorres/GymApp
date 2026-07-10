-- AlterTable
ALTER TABLE "access_logs" ADD COLUMN "override_reason" VARCHAR(40),
ADD COLUMN "override_note" TEXT,
ADD COLUMN "overridden_by" UUID;

-- CreateIndex
CREATE INDEX "access_logs_gym_id_override_reason_idx" ON "access_logs"("gym_id", "override_reason");
