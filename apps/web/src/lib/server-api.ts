import { auth } from '@/auth';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const session = await auth();
  if (!session) return null;
  // session.error se marca en auth.ts cuando el refresh automatico del
  // access token fallo — sin esto el fetch usaria un token que sabemos invalido.
  if ((session as { error?: string }).error) return null;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as { accessToken?: string }).accessToken ?? ''}`,
        ...init?.headers,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;
    if (res.status === 204) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export type DetailFetchResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'not_found' }
  | { kind: 'session_expired' }
  | { kind: 'error'; status: number; message: string };

/**
 * Variante de serverFetch para paginas de detalle (/entidad/[id]) que
 * DISTINGUE por que fallo la carga, en vez de colapsar todo a null.
 *
 * serverFetch() trata 401/403/500/red/404 exactamente igual (retorna null),
 * lo que llevaba a los `if (!data) notFound()` de las paginas de detalle a
 * mostrar la pagina "404 no encontrada" incluso cuando el problema real era
 * una sesion invalida o un error del servidor — indistinguible en la UI de
 * un ID que genuinamente no existe.
 */
export async function serverFetchDetail<T>(path: string): Promise<DetailFetchResult<T>> {
  const session = await auth();
  if (!session) return { kind: 'session_expired' };
  if ((session as { error?: string }).error) return { kind: 'session_expired' };

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as { accessToken?: string }).accessToken ?? ''}`,
      },
      next: { revalidate: 0 },
    });

    if (res.status === 404) return { kind: 'not_found' };
    if (res.status === 401 || res.status === 403) return { kind: 'session_expired' };

    if (!res.ok) {
      let message = `Error ${res.status}`;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (body.message)
          message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      } catch {
        // body no JSON — usa el mensaje default
      }
      return { kind: 'error', status: res.status, message };
    }

    return { kind: 'ok', data: (await res.json()) as T };
  } catch {
    return { kind: 'error', status: 0, message: 'Error de red. Verifica tu conexión.' };
  }
}

/**
 * Variante de serverFetch que LANZA error si la respuesta no es OK.
 * Úsala dentro de Server Actions para que el `redirect()` solo se ejecute
 * si la mutación fue exitosa, y el error burbujee al cliente.
 *
 * Mensaje:
 * - 401/403 → 'Sesión expirada. Recarga la página e intenta de nuevo.'
 * - 4xx con body.message → ese mensaje
 * - 5xx → 'Error del servidor. Intenta más tarde.'
 */
export async function serverMutate<T>(path: string, init?: RequestInit): Promise<T | null> {
  const session = await auth();
  if (!session) {
    throw new Error('Sesión expirada. Recarga la página e intenta de nuevo.');
  }
  if ((session as { error?: string }).error) {
    throw new Error('Sesión expirada. Recarga la página e intenta de nuevo.');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(session as { accessToken?: string }).accessToken ?? ''}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Sesión expirada. Recarga la página e intenta de nuevo.');
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      // Body no JSON — usa msg default
    }
    if (res.status >= 500) {
      throw new Error('Error del servidor. Intenta más tarde.');
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}
