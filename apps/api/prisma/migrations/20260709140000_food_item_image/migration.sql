-- AlterTable
ALTER TABLE "food_items" ADD COLUMN "image_url" TEXT;

-- CreateBucket (público — fotos de alimentos no son datos sensibles)
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;
