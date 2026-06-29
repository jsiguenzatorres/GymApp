import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { authApi, onboardingApi, setTokenRefresher } from '@/lib/api-client';
import { registerPushToken } from '@/lib/push';

// Show notifications as banners while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

const REFRESH_KEY = 'gymapp_refresh_token';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { loadStoredTokens, setUser, setTokens, logout } = useAuthStore();

  useEffect(() => {
    // Register global token refresher — used by api-client on 401
    setTokenRefresher(async () => {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return null;
      try {
        const tokens = await authApi.refresh(refreshToken);
        await setTokens(tokens.accessToken, tokens.refreshToken);
        return tokens.accessToken;
      } catch {
        await logout();
        return null;
      }
    });

    // Restore session on cold start
    async function restoreSession() {
      try {
        const token = await loadStoredTokens();
        if (token) {
          const user = await authApi.me(token);
          setUser(user);
          // Register FCM token in background — non-blocking
          registerPushToken(token).catch(() => null);
          // Onboarding: solo MEMBER, si no está completo redirigimos
          if (user.role === 'MEMBER' || user.role === 'MEMBER_TRIAL') {
            onboardingApi
              .get(token)
              .then((ob) => {
                if (!ob.completed_at) router.replace('/onboarding' as never);
              })
              .catch(() => null);
          }
        }
      } catch {
        await logout();
      } finally {
        setReady(true);
      }
    }
    restoreSession();
  }, []);

  if (!ready) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
      >
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="marketplace"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen name="nutrition" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="aria" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen
            name="notifications"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="appointments"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen name="payments" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="history" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="progress" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="gym" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="exercises" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="classes" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen
            name="gamification"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="session"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
