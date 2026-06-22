import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeTab() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hola, Miembro</Text>
        <Text style={styles.subtitle}>Bienvenido a GymApp</Text>
        {/* Dashboard del miembro se implementa en Sprint 1.5 */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Dashboard del miembro — Sprint 1.5</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 8 },
  greeting: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  placeholder: { padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center' },
  placeholderText: { color: '#9ca3af', fontSize: 14 },
});
