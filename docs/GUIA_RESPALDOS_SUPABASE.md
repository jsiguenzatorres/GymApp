# Guía de configuración — Respaldo automático de Supabase (plan Free)

El plan Free de Supabase no incluye backups automáticos ni point-in-time recovery, y pausa el proyecto tras 7 días sin actividad real contra la base de datos. Este mecanismo resuelve ambas cosas sin necesidad de subir a Supabase Pro: un workflow de GitHub Actions corre `pg_dump` cada día y sube el respaldo a Cloudflare R2. Ver la decisión completa en `docs/adr/ADR-011-supabase-backup-strategy.md`.

## 1. Crear un bucket dedicado en Cloudflare R2

1. Entra al dashboard de Cloudflare → **R2** → **Create bucket**.
2. Nómbralo, por ejemplo, `gymapp-backups` (mantenlo separado del bucket de storage de la app — `gymapp-storage` — para no mezclar respaldos con archivos de usuarios).
3. Región: automática (R2 no pide región específica).

## 2. Crear un token de API de R2 con permisos solo a ese bucket

4. En el dashboard de R2 → **Manage R2 API Tokens** → **Create API Token**.
5. Permisos: **Object Read & Write**, restringido únicamente al bucket `gymapp-backups` (no le des acceso a `gymapp-storage` — principio de mínimo privilegio).
6. Copia el **Access Key ID** y el **Secret Access Key** — el secreto solo se muestra una vez.
7. Anota también tu **Account ID** de Cloudflare (visible en la barra lateral del dashboard).

## 3. Obtener el connection string de Supabase para `pg_dump`

8. En el dashboard de Supabase → tu proyecto → **Connect** (botón en la parte superior).
9. Copia el connection string de la pestaña **"Session pooler"** (⚠️ no uses "Direct connection": esa solo resuelve por IPv6 salvo que pagues el add-on de IPv4, y los runners de GitHub Actions no tienen salida IPv6 — el job fallará al conectar).
10. Reemplaza `[YOUR-PASSWORD]` en el string por tu contraseña real de la base de datos.

## 4. Configurar los secrets en GitHub

11. Ve a **Settings → Secrets and variables → Actions** en el repo y crea:

    | Secret                     | Valor                                                                 |
    | --------------------------- | ---------------------------------------------------------------------- |
    | `SUPABASE_DB_URL`           | El connection string del "Session pooler" del paso 9-10                |
    | `R2_ACCESS_KEY_ID`           | El Access Key ID del paso 6                                            |
    | `R2_SECRET_ACCESS_KEY`       | El Secret Access Key del paso 6                                        |
    | `CLOUDFLARE_ACCOUNT_ID`      | El Account ID del paso 7                                               |
    | `R2_BACKUPS_BUCKET_NAME`     | `gymapp-backups` (o el nombre que le hayas dado en el paso 2)          |

    Si el repo tiene un ambiente `production` configurado (Settings → Environments), crea estos secrets ahí — el workflow ya está declarado con `environment: production`.

## 5. Probar el workflow manualmente

12. Ve a la pestaña **Actions** del repo → **Supabase DB Backup** → **Run workflow** (el trigger `workflow_dispatch` está habilitado justo para esto, no hace falta esperar al cron diario).
13. Revisa los logs: el paso "Generar el dump" debe mostrar un tamaño en bytes razonable (no unos pocos KB) y el paso "Subir a Cloudflare R2" debe terminar sin error.
14. Confirma en el dashboard de R2 que el archivo `gymapp-backup-<fecha>.dump` apareció en el bucket.

## 6. Cómo restaurar un respaldo

15. Baja el dump que necesites desde R2:
    ```bash
    aws s3 cp s3://gymapp-backups/gymapp-backup-2026-09-01.dump . \
      --endpoint-url https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
    ```
16. Restaura con el script incluido en el repo:
    ```bash
    ./scripts/restore-supabase-backup.sh gymapp-backup-2026-09-01.dump "<connection-string-destino>"
    ```
    El script usa `pg_restore --clean --if-exists`, así que sobreescribe los objetos existentes en la base de datos destino — úsalo contra una base vacía o de la que ya sabes que quieres reemplazar el contenido, nunca a ciegas contra producción.

## Notas

- **Retención:** el workflow borra automáticamente del bucket los respaldos con más de 30 días — ajustable cambiando `RETENTION_DAYS` al inicio de `.github/workflows/supabase-backup.yml`.
- **Efecto secundario útil:** al conectarse a diario, este mismo job cuenta como actividad real contra la base de datos y evita que Supabase pause el proyecto Free por inactividad.
- **Costo:** $0 adicional — corre dentro de los minutos gratis de GitHub Actions (un job de pocos minutos, una vez al día) y R2 no cobra egress; el almacenamiento de los dumps (unos pocos MB/GB para un solo gym) cae dentro de la capa gratuita de R2.
- **Esto no es point-in-time recovery.** El peor caso de pérdida de datos es de hasta 24 horas (lo que pasó entre el último dump y el incidente). Si eso deja de ser aceptable, es momento de evaluar subir a Supabase Pro.
