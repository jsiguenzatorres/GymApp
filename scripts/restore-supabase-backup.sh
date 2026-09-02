#!/usr/bin/env bash
#
# Restaura un respaldo de GymApp (generado por
# .github/workflows/supabase-backup.yml) contra una base de datos Postgres
# destino — útil para recuperar de un desastre o para levantar un ambiente
# nuevo con datos reales.
#
# Uso:
#   ./scripts/restore-supabase-backup.sh <archivo.dump> <connection-string-destino>
#
# Ejemplo (restaurar en local):
#   ./scripts/restore-supabase-backup.sh gymapp-backup-2026-09-01.dump \
#     "postgresql://gymapp:password@localhost:5432/gymapp_dev"
#
# Ejemplo (restaurar en un proyecto Supabase nuevo, usando su connection
# string de "Session pooler"):
#   ./scripts/restore-supabase-backup.sh gymapp-backup-2026-09-01.dump \
#     "postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
#
# Cómo bajar el dump de R2 primero (necesita AWS CLI configurado, ver
# docs/GUIA_RESPALDOS_SUPABASE.md):
#   aws s3 cp s3://<bucket>/gymapp-backup-2026-09-01.dump . \
#     --endpoint-url https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com

set -euo pipefail

DUMP_FILE="${1:?Falta la ruta del archivo .dump — uso: $0 <archivo.dump> <connection-string>}"
TARGET_DB_URL="${2:?Falta la connection string de destino — uso: $0 <archivo.dump> <connection-string>}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "No se encontró el archivo: $DUMP_FILE" >&2
  exit 1
fi

echo "Restaurando '${DUMP_FILE}' contra la base de datos de destino..."
echo "(Esto sobreescribe objetos existentes con el mismo nombre — confirma que es la base correcta)"

pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -d "$TARGET_DB_URL" \
  "$DUMP_FILE"

echo "Restauración completa."
