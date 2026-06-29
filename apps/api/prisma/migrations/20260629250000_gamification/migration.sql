-- Challenges
CREATE TABLE "challenges" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"        UUID NOT NULL,
  "name"          VARCHAR(150) NOT NULL,
  "description"   TEXT,
  "goal_type"     VARCHAR(30) NOT NULL,
  "goal_value"    INTEGER NOT NULL,
  "reward_points" INTEGER NOT NULL DEFAULT 100,
  "starts_at"     TIMESTAMP(3) NOT NULL,
  "ends_at"       TIMESTAMP(3) NOT NULL,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "cover_emoji"   VARCHAR(10) DEFAULT '🏆',
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "challenges_gym_id_is_active_ends_at_idx" ON "challenges"("gym_id", "is_active", "ends_at");
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_gym_id_fkey"
  FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Member challenges
CREATE TABLE "member_challenges" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "member_id"    UUID NOT NULL,
  "challenge_id" UUID NOT NULL,
  "progress"     INTEGER NOT NULL DEFAULT 0,
  "completed"    BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "joined_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_challenges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "member_challenges_member_id_challenge_id_key" ON "member_challenges"("member_id", "challenge_id");
CREATE INDEX "member_challenges_member_id_completed_idx" ON "member_challenges"("member_id", "completed");
ALTER TABLE "member_challenges" ADD CONSTRAINT "member_challenges_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_challenges" ADD CONSTRAINT "member_challenges_challenge_id_fkey"
  FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rewards
CREATE TABLE "rewards" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"      UUID NOT NULL,
  "name"        VARCHAR(150) NOT NULL,
  "description" TEXT,
  "cost_points" INTEGER NOT NULL,
  "stock"       INTEGER NOT NULL DEFAULT -1,
  "cover_emoji" VARCHAR(10) DEFAULT '🎁',
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rewards_gym_id_is_active_idx" ON "rewards"("gym_id", "is_active");
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_gym_id_fkey"
  FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reward redemptions
CREATE TABLE "reward_redemptions" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"       UUID NOT NULL,
  "member_id"    UUID NOT NULL,
  "reward_id"    UUID NOT NULL,
  "points_spent" INTEGER NOT NULL,
  "status"       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "redeemed_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at" TIMESTAMP(3),
  "notes"        TEXT,
  CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reward_redemptions_gym_id_status_redeemed_at_idx" ON "reward_redemptions"("gym_id", "status", "redeemed_at" DESC);
CREATE INDEX "reward_redemptions_member_id_idx" ON "reward_redemptions"("member_id");
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_fkey"
  FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON UPDATE CASCADE;

-- Referrals
CREATE TABLE "referrals" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"            UUID NOT NULL,
  "referrer_id"       UUID NOT NULL,
  "referred_email"    VARCHAR(150) NOT NULL,
  "referred_id"       UUID,
  "code"              VARCHAR(20) NOT NULL,
  "status"            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "reward_granted_at" TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "referrals_code_key" ON "referrals"("code");
CREATE INDEX "referrals_gym_id_status_idx" ON "referrals"("gym_id", "status");
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey"
  FOREIGN KEY ("referrer_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_fkey"
  FOREIGN KEY ("referred_id") REFERENCES "members"("id") ON UPDATE CASCADE;
