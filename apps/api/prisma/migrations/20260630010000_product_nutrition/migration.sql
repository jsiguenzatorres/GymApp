-- Agrega campos opcionales de información nutricional a Product
ALTER TABLE "products"
  ADD COLUMN "serving_size" VARCHAR(50),
  ADD COLUMN "calories_kcal" DECIMAL(8, 2),
  ADD COLUMN "protein_g" DECIMAL(8, 2),
  ADD COLUMN "carbs_g" DECIMAL(8, 2),
  ADD COLUMN "fat_g" DECIMAL(8, 2),
  ADD COLUMN "fiber_g" DECIMAL(8, 2),
  ADD COLUMN "sugar_g" DECIMAL(8, 2),
  ADD COLUMN "sodium_mg" DECIMAL(8, 2);
