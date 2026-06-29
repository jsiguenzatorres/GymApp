-- Fotos de progreso del miembro (antes/después)
CREATE TABLE "progress_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "category" VARCHAR(20) NOT NULL DEFAULT 'FRONT',
    "weight_kg" DECIMAL(5,2),
    "note" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "progress_photos_member_id_taken_at_idx"
  ON "progress_photos"("member_id", "taken_at" DESC);

ALTER TABLE "progress_photos"
  ADD CONSTRAINT "progress_photos_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
