import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { authApi, ApiError } from '@/lib/api-client';

const REFRESH_KEY = 'gymapp_refresh_token';

export function useAuthApi() {
  const { accessToken, setTokens, logout } = useAuthStore();

  const withAuth = useCallback(
    async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
      if (!accessToken) {
        router.replace('/(auth)/login');
        throw new ApiError('No token', 401);
      }
      try {
        return await fn(accessToken);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
          if (refreshToken) {
            try {
              const tokens = await authApi.refresh(refreshToken);
              await setTokens(tokens.accessToken, tokens.refreshToken);
              return await fn(tokens.accessToken);
            } catch {
              // refresh failed — fall through to logout
            }
          }
          await logout();
          router.replace('/(auth)/login');
        }
        throw err;
      }
    },
    [accessToken, setTokens, logout],
  );

  return { withAuth, token: accessToken };
}
