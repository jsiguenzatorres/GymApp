-- Los buckets de documentos sensibles (comprobantes de pago, exámenes de
-- laboratorio) deben ser privados, no públicos como avatars/product-images.
-- Se guarda la RUTA dentro del bucket, no una URL pública permanente — la URL
-- firmada (con expiración) se genera on-demand al leer el registro.

-- RenameColumn
ALTER TABLE "payments" RENAME COLUMN "voucher_url" TO "voucher_path";

-- RenameColumn
ALTER TABLE "lab_results" RENAME COLUMN "document_url" TO "document_path";

-- CreateBuckets (privados)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('payment-vouchers', 'payment-vouchers', false),
  ('lab-results', 'lab-results', false)
ON CONFLICT (id) DO NOTHING;
