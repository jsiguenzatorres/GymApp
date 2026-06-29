CREATE TABLE "member_onboardings" (
  "id"                     UUID NOT NULL DEFAULT gen_random_uuid(),
  "member_id"              UUID NOT NULL,
  "parq_completed"         BOOLEAN NOT NULL DEFAULT false,
  "parq_has_conditions"    BOOLEAN,
  "parq_answers"           JSONB,
  "parq_completed_at"      TIMESTAMP(3),
  "goal_type"              VARCHAR(30),
  "goal_target_value"      DECIMAL(10,2),
  "goal_target_unit"       VARCHAR(10),
  "goal_deadline"          DATE,
  "goal_completed_at"      TIMESTAMP(3),
  "initial_photo_uploaded" BOOLEAN NOT NULL DEFAULT false,
  "initial_photo_at"       TIMESTAMP(3),
  "contract_accepted"      BOOLEAN NOT NULL DEFAULT false,
  "contract_accepted_at"   TIMESTAMP(3),
  "contract_version"       VARCHAR(20),
  "completed_at"           TIMESTAMP(3),
  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "member_onboardings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_onboardings_member_id_key" ON "member_onboardings"("member_id");

ALTER TABLE "member_onboardings" ADD CONSTRAINT "member_onboardings_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
