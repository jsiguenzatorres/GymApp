-- Fix race condition: dos requests concurrentes al POST /addons podian crear
-- dos filas ACTIVE del mismo type para el mismo miembro (ambas transacciones
-- veian "0 addons activos" antes de que la otra hiciera commit).

-- 1. Limpiar duplicados existentes: por cada (member_id, type) con mas de un
--    addon ACTIVE, conservar solo el mas reciente (created_at DESC) y cancelar
--    el resto con motivo explicito.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY member_id, type
      ORDER BY created_at DESC
    ) AS rn
  FROM member_addons
  WHERE status = 'ACTIVE'
)
UPDATE member_addons
SET
  status = 'CANCELLED',
  cancellation_reason = 'Duplicado detectado — limpieza automatica (race condition fix)',
  ends_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Constraint a nivel DB: maximo un addon ACTIVE por (member_id, type).
--    Esto hace que la segunda de dos transacciones concurrentes falle con
--    unique violation en vez de crear un duplicado silencioso.
CREATE UNIQUE INDEX "member_addons_member_id_type_active_key"
  ON "member_addons" ("member_id", "type")
  WHERE status = 'ACTIVE';
