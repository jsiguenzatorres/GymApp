import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

// Session is restored in _layout.tsx before this component renders.
export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
