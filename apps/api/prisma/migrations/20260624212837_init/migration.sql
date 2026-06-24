-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'GYM_OWNER', 'GYM_ADMIN', 'TRAINER', 'RECEPTIONIST', 'NUTRITIONIST', 'MEMBER', 'MEMBER_TRIAL');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('LEAD', 'TRIAL', 'ACTIVE', 'FREEZE', 'EXPIRED', 'PRE_CANCEL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SaasPlan" AS ENUM ('STARTER', 'PRO', 'ELITE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('TRIAL', 'ACTIVE', 'FROZEN', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "gyms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logo_url" TEXT,
    "saas_plan" "SaasPlan" NOT NULL DEFAULT 'STARTER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/El_Salvador',
    "country" VARCHAR(2) NOT NULL DEFAULT 'SV',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "city" VARCHAR(100),
    "phone" VARCHAR(20),
    "email" VARCHAR(150),
    "address" TEXT,
    "website" TEXT,
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "operating_hours" JSONB NOT NULL DEFAULT '{}',
    "tax_id" VARCHAR(20),
    "legal_name" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_fa_secret" TEXT,
    "two_fa_backup_codes" TEXT[],
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(45),
    "refresh_token_hash" TEXT,
    "reset_token_hash" TEXT,
    "reset_token_exp" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "bio" TEXT,
    "specialties" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "birthdate" DATE,
    "gender" VARCHAR(10),
    "avatar_url" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'LEAD',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_score_updated_at" TIMESTAMP(3),
    "loyalty_level" VARCHAR(20) NOT NULL DEFAULT 'bronze',
    "referred_by" UUID,
    "source" VARCHAR(50),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "billing_frequency" "BillingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "duration_days" INTEGER NOT NULL,
    "max_freezes" INTEGER NOT NULL DEFAULT 1,
    "max_freeze_days" INTEGER NOT NULL DEFAULT 30,
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_trial" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'TRIAL',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "price_paid" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "freeze_count" INTEGER NOT NULL DEFAULT 0,
    "frozen_at" TIMESTAMP(3),
    "freeze_ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "gateway" VARCHAR(30) NOT NULL,
    "gateway_token" VARCHAR(200) NOT NULL,
    "last_four" VARCHAR(4),
    "card_brand" VARCHAR(20),
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "membership_id" UUID,
    "payment_method_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_type" VARCHAR(30) NOT NULL,
    "gateway_payment_id" VARCHAR(200),
    "gateway_status" VARCHAR(50),
    "invoice_type" VARCHAR(5),
    "dte_codigo" VARCHAR(100),
    "dte_numero_control" VARCHAR(100),
    "dte_sello" VARCHAR(200),
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "next_retry_at" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "muscle_groups" TEXT[],
    "secondary_muscles" TEXT[],
    "equipment" TEXT[],
    "category" VARCHAR(30) NOT NULL DEFAULT 'STRENGTH',
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'INTERMEDIATE',
    "instructions" TEXT,
    "video_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "goal" VARCHAR(30),
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'INTERMEDIATE',
    "days_per_week" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plan_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "name" VARCHAR(100),

    CONSTRAINT "workout_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "block_type" VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps_min" INTEGER,
    "reps_max" INTEGER,
    "rpe" DOUBLE PRECISION,
    "rest_seconds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "workout_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "member_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "plan_id" UUID,
    "plan_day_id" UUID,
    "name" VARCHAR(200),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "duration_min" INTEGER,
    "notes" TEXT,
    "perceived_effort" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "duration_sec" INTEGER,
    "distance_m" DOUBLE PRECISION,
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "is_pr" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "record_type" VARCHAR(20) NOT NULL,
    "value" DECIMAL(8,2) NOT NULL,
    "unit" VARCHAR(10) NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "session_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "staff_id" UUID,
    "interaction_type" VARCHAR(30) NOT NULL,
    "channel" VARCHAR(30),
    "subject" VARCHAR(200),
    "notes" TEXT,
    "sentiment" VARCHAR(10),
    "outcome" VARCHAR(30),
    "follow_up_at" TIMESTAMP(3),
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "staff_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "appointment_type" VARCHAR(30) NOT NULL DEFAULT 'CONSULTATION',
    "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "metric_key" VARCHAR(50) NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID,
    "result" VARCHAR(30) NOT NULL,
    "method" VARCHAR(20) NOT NULL DEFAULT 'QR',
    "nonce" VARCHAR(64),
    "device_id" VARCHAR(100),
    "notes" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(60) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channel" VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gyms_slug_key" ON "gyms"("slug");

-- CreateIndex
CREATE INDEX "gyms_saas_plan_is_active_idx" ON "gyms"("saas_plan", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_is_active_idx" ON "users"("email", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE INDEX "staff_gym_id_is_active_idx" ON "staff"("gym_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");

-- CreateIndex
CREATE INDEX "members_gym_id_status_idx" ON "members"("gym_id", "status");

-- CreateIndex
CREATE INDEX "members_gym_id_risk_score_idx" ON "members"("gym_id", "risk_score");

-- CreateIndex
CREATE INDEX "members_gym_id_created_at_idx" ON "members"("gym_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "membership_types_gym_id_is_active_idx" ON "membership_types"("gym_id", "is_active");

-- CreateIndex
CREATE INDEX "membership_types_gym_id_sort_order_idx" ON "membership_types"("gym_id", "sort_order");

-- CreateIndex
CREATE INDEX "memberships_gym_id_status_idx" ON "memberships"("gym_id", "status");

-- CreateIndex
CREATE INDEX "memberships_gym_id_member_id_idx" ON "memberships"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "memberships_gym_id_end_date_idx" ON "memberships"("gym_id", "end_date");

-- CreateIndex
CREATE INDEX "payment_methods_gym_id_member_id_is_active_idx" ON "payment_methods"("gym_id", "member_id", "is_active");

-- CreateIndex
CREATE INDEX "payments_gym_id_status_idx" ON "payments"("gym_id", "status");

-- CreateIndex
CREATE INDEX "payments_gym_id_member_id_idx" ON "payments"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "payments_gym_id_created_at_idx" ON "payments"("gym_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payments_gym_id_paid_at_idx" ON "payments"("gym_id", "paid_at");

-- CreateIndex
CREATE INDEX "exercises_gym_id_idx" ON "exercises"("gym_id");

-- CreateIndex
CREATE INDEX "exercises_category_is_active_idx" ON "exercises"("category", "is_active");

-- CreateIndex
CREATE INDEX "workout_plans_gym_id_is_active_idx" ON "workout_plans"("gym_id", "is_active");

-- CreateIndex
CREATE INDEX "workout_plan_days_plan_id_day_number_idx" ON "workout_plan_days"("plan_id", "day_number");

-- CreateIndex
CREATE INDEX "workout_blocks_day_id_order_idx" ON "workout_blocks"("day_id", "order");

-- CreateIndex
CREATE INDEX "member_plans_gym_id_member_id_is_active_idx" ON "member_plans"("gym_id", "member_id", "is_active");

-- CreateIndex
CREATE INDEX "workout_sessions_gym_id_member_id_idx" ON "workout_sessions"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "workout_sessions_gym_id_started_at_idx" ON "workout_sessions"("gym_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "workout_sets_session_id_exercise_id_idx" ON "workout_sets"("session_id", "exercise_id");

-- CreateIndex
CREATE INDEX "personal_records_gym_id_member_id_idx" ON "personal_records"("gym_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_records_gym_id_member_id_exercise_id_record_type_key" ON "personal_records"("gym_id", "member_id", "exercise_id", "record_type");

-- CreateIndex
CREATE INDEX "crm_interactions_gym_id_member_id_idx" ON "crm_interactions"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "crm_interactions_gym_id_occurred_at_idx" ON "crm_interactions"("gym_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "appointments_gym_id_scheduled_at_idx" ON "appointments"("gym_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_gym_id_member_id_idx" ON "appointments"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "appointments_gym_id_status_idx" ON "appointments"("gym_id", "status");

-- CreateIndex
CREATE INDEX "metric_snapshots_gym_id_date_idx" ON "metric_snapshots"("gym_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "metric_snapshots_gym_id_date_metric_key_key" ON "metric_snapshots"("gym_id", "date", "metric_key");

-- CreateIndex
CREATE INDEX "access_logs_gym_id_occurred_at_idx" ON "access_logs"("gym_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "access_logs_gym_id_member_id_idx" ON "access_logs"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "access_logs_gym_id_result_idx" ON "access_logs"("gym_id", "result");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_gym_id_created_at_idx" ON "notifications"("gym_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_types" ADD CONSTRAINT "membership_types_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "membership_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plan_days" ADD CONSTRAINT "workout_plan_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "workout_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_plans" ADD CONSTRAINT "member_plans_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_plans" ADD CONSTRAINT "member_plans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_plans" ADD CONSTRAINT "member_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "workout_plan_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
