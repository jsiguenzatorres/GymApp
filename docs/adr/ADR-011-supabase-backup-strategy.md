# ADR-011: Respaldo independiente de la base de datos (Supabase Free → R2)

**Estado:** Aceptado
**Fecha:** Septiembre 2026
**Módulos afectados:** Infraestructura (Base de Datos)

## Contexto

El proyecto usa actualmente Supabase en el plan **Free** para alojar PostgreSQL. Ese plan:

- No incluye backups automáticos ni point-in-time recovery (eso empieza en el plan Pro, $25/mes — ver sección 21 de `CLAUDE.md`).
- Pausa el proyecto tras 7 días sin actividad real contra la base de datos.

Subir a Supabase Pro es la opción recomendada apenas el volumen o los ingresos lo justifiquen, pero mientras tanto la aplicación ya está en producción real con datos de un gym cliente (membresías, registro de pagos vía formulario, ~100 usuarios activos), así que operar sin ningún respaldo no es aceptable en el mientras tanto.

## Decisión

Implementar un mecanismo de respaldo propio, independiente del plan de Supabase, apoyado en acceso directo a Postgres (`pg_dump`) — no en una función propietaria de Supabase, por lo que funciona igual en cualquier plan:

1. **Workflow de GitHub Actions** (`.github/workflows/supabase-backup.yml`) corre diario, genera un dump con `pg_dump -Fc` (formato custom, comprimido) contra el connection string de "Session pooler" de Supabase, y lo sube a un bucket dedicado en Cloudflare R2 (`gymapp-backups`, separado del bucket de storage de la app).
2. **Retención de 30 días**: el mismo workflow borra del bucket los dumps más viejos que la ventana configurada.
3. **Validación mínima**: el workflow aborta sin subir nada si el dump generado es sospechosamente pequeño, y falla visiblemente (exit code ≠ 0) ante cualquier error de `pg_dump` o de la subida.
4. **Efecto secundario deseado**: al conectarse a diario, este job también cuenta como actividad real contra la base de datos y evita que Supabase pause el proyecto Free por inactividad.
5. **Restauración documentada** vía `scripts/restore-supabase-backup.sh` + `pg_restore`, con los pasos completos en `docs/GUIA_RESPALDOS_SUPABASE.md`.

## Alternativas consideradas

1. **Esperar y no respaldar hasta subir a Supabase Pro:** descartado — ya hay datos reales de un gym cliente en producción; el riesgo de pérdida de datos sin ningún respaldo mientras tanto no es aceptable.
2. **Subir a Supabase Pro únicamente por los backups:** válido a mediano plazo (además da point-in-time recovery real), pero no hace falta resolverlo hoy solo para tener un respaldo — este mecanismo cubre la necesidad inmediata sin el costo recurrente de $25/mes.
3. **Guardar los dumps como GitHub Actions artifacts en vez de R2:** descartado — los artifacts se borran por default a los 90 días, no están pensados para almacenamiento a largo plazo ni con control de acceso fino, y R2 ya es parte del stack del proyecto (storage de marketplace) sin costo de egress.
4. **Usar la "Direct connection" de Supabase en vez de "Session pooler":** descartado para este caso — la conexión directa de Supabase solo resuelve por IPv6 salvo que se pague el add-on de IPv4, y los runners de GitHub Actions no tienen salida IPv6.

## Consecuencias

**Positivo:**

- Respaldo diario funcionando sin costo adicional (dentro de los minutos gratis de GitHub Actions y la capa gratuita de R2 para el volumen de un solo gym).
- Evita que el proyecto de Supabase se pause por inactividad.
- Sigue siendo útil como respaldo secundario "off-platform" incluso después de migrar a Supabase Pro (regla 3-2-1: no depender de que el único respaldo viva en la misma plataforma que los datos originales).

**Negativo:**

- No es point-in-time recovery: la granularidad de recuperación es de 1 día — el punto de restauración más reciente puede tener hasta 24 horas de antigüedad respecto a un incidente.
- Requiere mantener una credencial de Postgres con permisos de lectura amplios como secret de GitHub Actions — superficie de riesgo adicional a vigilar y rotar periódicamente.
- Es responsabilidad del equipo, no de Supabase, notar si el workflow empieza a fallar silenciosamente (revisar la pestaña Actions periódicamente, o agregar notificaciones más adelante).

## Revisión futura

Reevaluar esta decisión cuando: (a) se suba a Supabase Pro — evaluar si este mecanismo se mantiene como respaldo secundario off-platform (recomendado) o se retira, o (b) el volumen de datos crezca lo suficiente como para que un dump diario completo sea lento o costoso, momento en que convendría evaluar backups incrementales.
