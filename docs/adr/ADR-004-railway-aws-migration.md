# ADR-004: Railway.app en P1–P2, Migración a AWS ECS Fargate en P3+

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** Infraestructura (todos)

## Contexto

Necesitamos una estrategia de deployment que balancee velocidad de iteración en fases tempranas con la capacidad de escalar a producción real en fases maduras.

## Decisión

### Fase 1–2 (MVP y Growth): Railway.app
**Justificación:**
- Zero-config: `git push` → deploy automático
- PostgreSQL + Redis incluidos, con backups automáticos
- Costos predecibles: ~$50–300/mes para < 50 gyms
- No requiere DevOps especializado
- Dashboard limpio para monitorear el servicio

**Configuración Railway:**
- `apps/api` → servicio Node.js con auto-deploy en merge a `main`
- PostgreSQL 16 → managed, con conexión vía `DATABASE_URL`
- Redis → Upstash (serverless, pay-per-use)
- Environment variables → Doppler sync con Railway

### Fase 3+ (Scale): AWS ECS Fargate
**Trigger de migración:** > 50 gyms activos o > $500/mes en Railway

**Arquitectura AWS:**
```
Route 53 → Cloudflare CDN/WAF
  ↓
Application Load Balancer
  ↓
ECS Fargate (apps/api) — auto-scaling 2-20 tasks
  ↓
RDS PostgreSQL 16 Multi-AZ
  ↓
ElastiCache Redis (cluster mode)
```

**Cloudflare permanece en todas las fases:** CDN, WAF, DDoS protection, R2 storage.

## Preparación para migración (desde P1)

Para que la migración no sea traumática, desde P1 se aplica:
1. Aplicación completamente stateless (sin estado en memoria, todo en DB/Redis)
2. `DATABASE_URL` y configuración via variables de entorno (sin hardcoding)
3. Health check endpoint `/health` para load balancer
4. Graceful shutdown en la aplicación NestJS
5. Dockerfiles mantenidos (Railway usa buildpacks, pero Docker es el target de AWS)

## Alternativas consideradas

1. **AWS desde el inicio:** Costo de setup en tiempo (~2–3 semanas) y dinero (~$300/mes mínimo). No justificado en MVP.
2. **Vercel + PlanetScale:** Vercel no soporta WebSocket bien. PlanetScale no tiene pgvector. Descartado.
3. **GCP Cloud Run:** Válido, pero el ecosistema AWS es más familiar y tiene más integraciones.
4. **Heroku:** Más caro que Railway por las mismas funcionalidades. Descartado.

## Consecuencias

**Positivo:**
- Velocidad máxima en P1–P2 con Railway
- Sin lock-in real: aplicación stateless y containerizada

**Negativo:**
- La migración en P3 será un proyecto de 1–2 semanas de esfuerzo (documentado en plan de trabajo como S3-12)
- Configuración de VPC, security groups, IAM roles requiere conocimiento AWS en P3
