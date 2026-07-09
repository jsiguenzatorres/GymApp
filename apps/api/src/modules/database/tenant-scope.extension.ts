import { Prisma } from '@prisma/client';
import { getCurrentGymId } from '../../common/context/tenant-context';

/**
 * Descubre en runtime, vía el DMMF de Prisma, todos los modelos que tienen
 * columna gym_id — evita mantener una lista hardcodeada que se desactualiza
 * cada vez que se agrega una tabla de negocio nueva.
 */
const GYM_SCOPED_MODELS = new Set(
  Prisma.dmmf.datamodel.models
    .filter((model) => model.fields.some((field) => field.name === 'gym_id'))
    .map((model) => model.name),
);

const READ_MANY_OPERATIONS = new Set(['findMany', 'count', 'aggregate', 'groupBy']);
const BULK_MUTATE_OPERATIONS = new Set(['updateMany', 'deleteMany']);
const SINGLE_READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
]);
const SINGLE_MUTATE_OPERATIONS = new Set(['update', 'delete']);

function toDelegateKey(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

/**
 * Red de seguridad de aislamiento multi-tenant a nivel de Prisma Client.
 *
 * El filtrado por gym_id ya se hace a mano en cada service (`where: {gym_id}`)
 * — esta extensión NO reemplaza eso, es una segunda capa que actúa si algún
 * método nuevo olvida agregar el filtro. Se aplica sobre TODOS los modelos
 * con columna gym_id, usando el gymId del AsyncLocalStorage poblado por
 * TenantMiddleware a partir del JWT de la request.
 *
 * No se usa RLS de PostgreSQL a propósito: la conexión pasa por el pooler de
 * Supabase en modo transacción/sesión compartida, y RLS requiere fijar de
 * forma confiable una variable de sesión por request antes de cada query —
 * con pooling eso es propenso a fallar silenciosamente y dejar la app
 * devolviendo cero filas en todos lados. Esta extensión logra el mismo
 * objetivo práctico sin tocar el pooling de conexiones.
 *
 * create/createMany/upsert quedan fuera a propósito: el código existente ya
 * setea gym_id explícito en esos payloads, e inyectarlo automáticamente en
 * un `data` anidado arbitrario es más riesgoso que el beneficio que da.
 *
 * Cuando no hay gymId en el contexto (SUPER_ADMIN, cron jobs, scripts fuera
 * de un request HTTP) la extensión no interviene — confía en el filtrado
 * manual que esos flujos ya hacen explícitamente.
 */
export const tenantScopeExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!GYM_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const gymId = getCurrentGymId();
          if (!gymId) {
            return query(args);
          }

          const queryArgs = args as Record<string, unknown>;

          if (READ_MANY_OPERATIONS.has(operation) || BULK_MUTATE_OPERATIONS.has(operation)) {
            queryArgs.where = { ...((queryArgs.where as object) ?? {}), gym_id: gymId };
            return query(queryArgs);
          }

          if (SINGLE_READ_OPERATIONS.has(operation)) {
            const result = await query(args);
            const row = result as { gym_id?: string } | null;
            if (row?.gym_id && row.gym_id !== gymId) {
              return null;
            }
            return result;
          }

          if (SINGLE_MUTATE_OPERATIONS.has(operation)) {
            // update/delete requieren un where con clave única — no se le
            // puede mezclar gym_id sin arriesgar romper esa unicidad. En su
            // lugar se verifica la propiedad ANTES de dejar pasar la
            // mutación real, usando el cliente base (sin esta extensión)
            // para evitar cualquier recursión.
            const delegate = (
              client as unknown as Record<string, { findFirst: (a: unknown) => Promise<unknown> }>
            )[toDelegateKey(model)];
            const existing = (await delegate.findFirst({ where: queryArgs.where })) as {
              gym_id?: string;
            } | null;
            if (!existing || existing.gym_id !== gymId) {
              throw new Prisma.PrismaClientKnownRequestError(
                `Aislamiento de tenant: intento de ${operation} en ${model} fuera del gym actual`,
                { code: 'P2025', clientVersion: Prisma.prismaVersion.client },
              );
            }
            return query(args);
          }

          return query(args);
        },
      },
    },
  }),
);
