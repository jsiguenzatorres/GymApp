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
