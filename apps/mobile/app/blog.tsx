import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { blogApi, BlogPostSummary } from '@/lib/api-client';

export default function BlogScreen() {
  const { accessToken } = useAuthStore();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    blogApi
      .list(accessToken)
      .then(setPosts)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📰 Blog del gym</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📰</Text>
            <Text style={styles.emptyText}>Tu gym aún no ha publicado posts</Text>
          </View>
        ) : (
          posts.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/blog/${p.slug}` as never)}
              activeOpacity={0.85}
            >
              {p.cover_url && <Image source={{ uri: p.cover_url }} style={styles.cover} />}
              <View style={styles.cardBody}>
                {p.category && <Text style={styles.cat}>{p.category.toUpperCase()}</Text>}
                <Text style={styles.title}>{p.title}</Text>
                {p.excerpt && <Text style={styles.excerpt}>{p.excerpt}</Text>}
                <View style={styles.metaRow}>
                  {p.author_name && <Text style={styles.meta}>✍️ {p.author_name}</Text>}
                  {p.published_at && (
                    <Text style={styles.meta}>
                      {new Date(p.published_at).toLocaleDateString('es-SV', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 28, color: '#111827', fontWeight: '400' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  scroll: { padding: 16, gap: 12 },

  empty: { paddingVertical: 64, alignItems: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' },

  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  cover: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 14, gap: 4 },
  cat: { fontSize: 10, color: '#7c3aed', fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  excerpt: { fontSize: 13, color: '#6b7280', lineHeight: 19, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { fontSize: 11, color: '#9ca3af' },
});
