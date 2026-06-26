import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiClient } from '@/lib/api-client';
import { memberApi } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  payment_type: string;
  description?: string;
  paid_at?: string;
  created_at: string;
  membership?: { type: { name: string } };
}

const STATUS_CONFIG: Record<Payment['status'], { label: string; color: string }> = {
  SUCCEEDED: { label: 'Pagado', color: '#22c55e' },
  PENDING: { label: 'Pendiente', color: '#eab308' },
  FAILED: { label: 'Fallido', color: '#ef4444' },
  REFUNDED: { label: 'Reembolsado', color: '#94a3b8' },
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  STRIPE: 'Stripe',
  MERCADOPAGO: 'MercadoPago',
};

function formatPaymentType(type: string): string {
  return PAYMENT_TYPE_LABELS[type] ?? type;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

function getTotalThisYear(payments: Payment[]): number {
  const currentYear = new Date().getFullYear();
  return payments
    .filter((p) => {
      if (p.status !== 'SUCCEEDED') return false;
      const date = new Date(p.paid_at ?? p.created_at);
      return date.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

function PaymentCard({ item }: { item: Payment }) {
  const statusCfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: '#94a3b8' };
  const title = item.membership?.type?.name ?? item.description ?? 'Pago';
  const dateStr = formatDate(item.paid_at ?? item.created_at);
  const typeLabel = formatPaymentType(item.payment_type);

  return (
    <View style={styles.card}>
      <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />

      <View style={styles.cardCenter}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.cardDate}>{dateStr}</Text>
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.cardAmount}>{formatAmount(item.amount, item.currency)}</Text>
        <Text style={[styles.cardStatus, { color: statusCfg.color }]}>{statusCfg.label}</Text>
      </View>
    </View>
  );
}

export default function PaymentsScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (isRefresh = false) => {
      if (!accessToken) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const me = await memberApi.getMe(accessToken);
        const data = await apiClient.get<Payment[]>(
          `/api/v1/members/${me.id}/payments`,
          accessToken,
        );

        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.paid_at ?? a.created_at).getTime();
          const dateB = new Date(b.paid_at ?? b.created_at).getTime();
          return dateB - dateA;
        });

        setPayments(sorted);
      } catch {
        setError('No se pudo cargar el historial de pagos.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const total = getTotalThisYear(payments);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Pagos</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPayments()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPayments(true)}
              tintColor="#2563eb"
            />
          }
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total pagado este año</Text>
              <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>Sin historial de pagos</Text>
            </View>
          }
          renderItem={({ item }) => <PaymentCard item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    minWidth: 80,
  },
  backText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerRight: {
    minWidth: 80,
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#3b82f6',
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: -0.5,
  },

  // Payment card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
    flexShrink: 0,
  },
  cardCenter: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeChipText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  cardStatus: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 24,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
