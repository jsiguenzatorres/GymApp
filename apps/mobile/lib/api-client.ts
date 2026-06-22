const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(body.message ?? `HTTP ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),

  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET' }, token),
};

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    gymId?: string;
    firstName?: string;
    lastName?: string;
    twoFaEnabled: boolean;
  };
}

export const authApi = {
  login: (email: string, password: string, totp?: string) =>
    apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password, totp }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/refresh', {
      refreshToken,
    }),

  me: (token: string) => apiClient.get<LoginResponse['user']>('/api/v1/auth/me', token),
};
