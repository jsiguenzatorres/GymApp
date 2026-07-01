import { auth } from '@/auth';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const session = await auth();
  if (!session) return null;

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
