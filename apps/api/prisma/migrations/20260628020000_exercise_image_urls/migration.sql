-- Agregar campo image_urls al modelo Exercise (free-exercise-db da 2 fotos: pose inicial/final)
ALTER TABLE "exercises"
  ADD COLUMN "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
