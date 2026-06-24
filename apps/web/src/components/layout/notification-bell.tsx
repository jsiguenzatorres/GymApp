'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

const TYPE_ICON: Record<string, string> = {
  'payment.failed': '💳',
  'payment.succeeded': '✅',
  'membership.activated': '🎉',
  'membership.expired': '⚠️',
  'workout.pr_achieved': '🏆',
  'workout.plan_assigned': '📋',
  'crm.risk_score_high': '🔶',
  'crm.risk_score_critical': '🚨',
};

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Polling cada 30s para actualizar el badge
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/proxy/notifications/unread-count');
        if (res.ok) {
          const data: { count: number } = await res.json();
          setCount(data.count);
        }
      } catch {
        /* ignore */
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleOpen() {
    if (!open) {
      setLoading(true);
      setOpen(true);
      try {
        const res = await fetch('/api/proxy/notifications?limit=10');
        if (res.ok) {
          const data: { items: Notification[] } = await res.json();
          setNotifs(data.items);
        }
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  }

  async function markRead(id: string) {
    await fetch(`/api/proxy/notifications/${id}/read`, { method: 'PATCH' });
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setCount((c) => Math.max(0, c - 1));
  }

  async function markAll() {
    await fetch('/api/proxy/notifications/read-all', { method: 'PATCH' });
    setNotifs((ns) => ns.map((n) => ({ ...n, is_read: true })));
    setCount(0);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
            {count > 0 && (
              <button onClick={markAll} className="text-xs text-violet-600 hover:underline">
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              </div>
            ) : notifs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Sin notificaciones</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 ${!n.is_read ? 'bg-violet-50/40' : ''}`}
                >
                  <span className="mt-0.5 shrink-0 text-lg">{TYPE_ICON[n.type] ?? '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>
                    <p className="mt-1 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-violet-600 hover:underline"
            >
              Ver todas las notificaciones →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
