import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarLabel: 'Inicio' }} />
      <Tabs.Screen name="workout" options={{ title: 'Entrenar', tabBarLabel: 'Entrenar' }} />
      <Tabs.Screen name="qr" options={{ title: 'Acceso QR', tabBarLabel: 'Acceso' }} />
      <Tabs.Screen name="profile" options={{ title: 'Mi Perfil', tabBarLabel: 'Perfil' }} />
    </Tabs>
  );
}
