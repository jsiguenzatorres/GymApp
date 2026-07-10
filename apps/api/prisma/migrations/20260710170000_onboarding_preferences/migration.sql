-- AlterTable
ALTER TABLE "member_onboardings" ADD COLUMN "desired_outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "intensity_preference" INTEGER,
ADD COLUMN "planning_style" VARCHAR(20),
ADD COLUMN "preferences_completed_at" TIMESTAMP(3);
