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
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { blogApi, BlogPost } from '@/lib/api-client';

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { accessToken } = useAuthStore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !slug) return;
    blogApi
      .getBySlug(accessToken, slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [accessToken, slug]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Post no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post.title}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {post.cover_url && (
          <Image source={{ uri: post.cover_url }} style={styles.cover} resizeMode="cover" />
        )}
        {post.category && <Text style={styles.cat}>{post.category.toUpperCase()}</Text>}
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.meta}>
          {post.author_name && <Text style={styles.metaText}>✍️ {post.author_name}</Text>}
          {post.published_at && (
            <Text style={styles.metaText}>
              {new Date(post.published_at).toLocaleDateString('es-SV', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          )}
          <Text style={styles.metaText}>👁️ {post.views_count}</Text>
        </View>
        {/* Markdown renderizado básico: solo preserva line breaks */}
        <Text style={styles.body}>{post.content_md}</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, color: '#6b7280' },
  backLink: { color: '#1d4ed8', marginTop: 8, fontWeight: '700' },
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
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center' },

  scroll: { padding: 16, gap: 8 },
  cover: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#e5e7eb' },
  cat: { fontSize: 11, color: '#7c3aed', fontWeight: '800', letterSpacing: 0.5, marginTop: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { fontSize: 11, color: '#9ca3af' },
  body: { fontSize: 15, color: '#374151', lineHeight: 23, marginTop: 12 },
});
