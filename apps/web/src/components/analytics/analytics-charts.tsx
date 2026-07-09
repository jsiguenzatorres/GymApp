'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueTrendEntry {
  month: string;
  revenue: number;
  transactions: number;
  newMembers: number;
}

interface MemberStatusEntry {
  status: string;
  count: number;
}

interface MembershipEntry {
  name: string;
  count: number;
  price: number;
}

interface AnalyticsChartsProps {
  revenueTrend: RevenueTrendEntry[];
  memberStatusDistribution: MemberStatusEntry[];
  membershipBreakdown: MembershipEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#ff5a1f',
  TRIAL: '#2563eb',
  FROZEN: '#0891b2',
  EXPIRED: '#9ca3af',
  PRE_CANCEL: '#f59e0b',
  CANCELLED: '#ef4444',
  LEAD: '#a78bfa',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  TRIAL: 'Trial',
  FROZEN: 'Congelado',
  EXPIRED: 'Expirado',
  PRE_CANCEL: 'Pre-cancelar',
  CANCELLED: 'Cancelado',
  LEAD: 'Lead',
};

const PIE_COLORS = ['#ff5a1f', '#2563eb', '#0891b2', '#059669', '#f59e0b', '#ef4444', '#a78bfa'];

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function AnalyticsCharts({
  revenueTrend,
  memberStatusDistribution,
  membershipBreakdown,
}: AnalyticsChartsProps) {
  const [coachQuery, setCoachQuery] = useState('');
  const [coachAnswer, setCoachAnswer] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  async function handleCoachSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coachQuery.trim()) return;
    setCoachLoading(true);
    try {
      const res = await fetch('/api/proxy/analytics/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: coachQuery }),
      });
      const data = await res.json();
      setCoachAnswer(data.answer ?? 'Sin respuesta');
    } catch {
      setCoachAnswer('Error al consultar al Business Coach');
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-semibold text-gray-900">Ingresos mensuales (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
              labelStyle={{ color: '#111' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#ff5a1f"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              dot={{ r: 4, fill: '#ff5a1f', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Members Bar */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-semibold text-gray-900">Nuevos miembros por mes</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip formatter={(v: number) => [v, 'Nuevos miembros']} />
              <Bar dataKey="newMembers" fill="#ff5a1f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Member Status Pie */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-semibold text-gray-900">Distribución por estado</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={memberStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={2}
                >
                  {memberStatusDistribution.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _name, props) => [
                    v,
                    STATUS_LABELS[props.payload.status] ?? props.payload.status,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-sm">
              {memberStatusDistribution.map((entry, i) => (
                <li key={entry.status} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          STATUS_COLORS[entry.status] ?? PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </span>
                  <span className="font-medium">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Membership Breakdown */}
      {membershipBreakdown.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-semibold text-gray-900">Membresías activas por plan</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={membershipBreakdown}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip formatter={(v: number) => [v, 'Miembros']} />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Business Coach */}
      <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
            BC
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Business Coach IA</h2>
            <p className="text-xs text-gray-500">
              Consultas en lenguaje natural sobre tus métricas
            </p>
          </div>
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Beta P2
          </span>
        </div>

        <form onSubmit={handleCoachSubmit} className="flex gap-3">
          <input
            type="text"
            value={coachQuery}
            onChange={(e) => setCoachQuery(e.target.value)}
            placeholder="Ej: ¿Cuál fue el mes con más ingresos? ¿Cuántos miembros tengo en riesgo?"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-violet-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={coachLoading || !coachQuery.trim()}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {coachLoading ? '…' : 'Preguntar'}
          </button>
        </form>

        {coachAnswer && (
          <div className="mt-4 rounded-lg bg-white p-4 text-sm text-gray-700 shadow-sm ring-1 ring-violet-100">
            <p className="mb-1 text-xs font-medium text-violet-600">Business Coach</p>
            {coachAnswer}
          </div>
        )}
      </div>
    </div>
  );
}
