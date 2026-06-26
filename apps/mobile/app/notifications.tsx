import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  items: Notif[];
  total: number;
  unreadCount: number;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} h`;
  if (diffDay === 1) return 'ayer';
  if (diffDay < 30) return `${diffDay} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiClient.get<NotificationsResponse>(
        '/api/v1/notifications?page=1&limit=30',
        accessToken ?? undefined,
      );
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent fail — keep existing data
    }
  }, [accessToken]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await apiClient.patch(`/api/v1/notifications/${id}/read`, {}, accessToken ?? undefined);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silent fail
      }
    },
    [accessToken],
  );

  const markAllAsRead = useCallback(async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await apiClient.patch('/api/v1/notifications/read-all', {}, accessToken ?? undefined);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    } finally {
      setMarkingAll(false);
    }
  }, [accessToken, markingAll]);

  const handleCardPress = useCallback(
    (item: Notif) => {
      if (!item.is_read) {
        markAsRead(item.id);
      }
    },
    [markAsRead],
  );

  const renderItem = ({ item }: { item: Notif }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => handleCardPress(item)}
      style={[styles.card, !item.is_read && styles.cardUnread]}
    >
      {!item.is_read && <View style={styles.unreadBorder} />}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardTime}>{getRelativeTime(item.created_at)}</Text>
        </View>
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>No tienes notificaciones</Text>
    </View>
  );

  const titleText = unreadCount > 0 ? `Notificaciones (${unreadCount})` : 'Notificaciones';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {titleText}
        </Text>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={markAllAsRead}
            disabled={markingAll}
            style={styles.readAllButton}
          >
            <Text style={[styles.readAllText, markingAll && styles.readAllTextDisabled]}>
              {markingAll ? '...' : 'Leer todo'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            notifications.length === 0 ? styles.listEmptyContent : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1d4ed8']}
              tintColor="#1d4ed8"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    minWidth: 80,
  },
  backText: {
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  readAllButton: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  readAllText: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  readAllTextDisabled: {
    color: '#6b7280',
  },
  headerSpacer: {
    minWidth: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  listEmptyContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginVertical: 5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#f0f4ff',
  },
  unreadBorder: {
    width: 4,
    backgroundColor: '#1d4ed8',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardTime: {
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 0,
    marginTop: 1,
  },
  cardBody: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
