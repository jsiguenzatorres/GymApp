import { Redirect } from 'expo-router';

// La raíz redirige al login o a las tabs según la sesión
// La lógica de sesión se implementa en Sprint 1.1 con expo-secure-store
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
