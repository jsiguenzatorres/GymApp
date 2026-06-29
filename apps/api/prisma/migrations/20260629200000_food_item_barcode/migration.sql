-- Agregar campos barcode y source a food_items (para escaneo + cache OpenFoodFacts)
ALTER TABLE "food_items"
  ADD COLUMN "barcode" VARCHAR(50),
  ADD COLUMN "source" VARCHAR(30);

CREATE UNIQUE INDEX "food_items_barcode_key" ON "food_items"("barcode") WHERE "barcode" IS NOT NULL;
CREATE INDEX "food_items_barcode_idx" ON "food_items"("barcode") WHERE "barcode" IS NOT NULL;
