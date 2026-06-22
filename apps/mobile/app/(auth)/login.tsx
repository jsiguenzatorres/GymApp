import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>GymApp</Text>
        <Text style={styles.subtitle}>Tu gimnasio en tu bolsillo</Text>
        {/* LoginForm se implementa en Sprint 1.1 */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Formulario de login — Sprint 1.1</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: { fontSize: 32, fontWeight: '700', color: '#1d4ed8' },
  subtitle: { fontSize: 16, color: '#6b7280' },
  placeholder: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  placeholderText: { color: '#9ca3af', fontSize: 14 },
});
