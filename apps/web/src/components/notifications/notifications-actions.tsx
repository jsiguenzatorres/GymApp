'use client';

import { useRouter } from 'next/navigation';

export function UnreadFilter({ checked }: { checked: boolean }) {
  const router = useRouter();
  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const url = new URL(window.location.href);
    if (e.target.checked) {
      url.searchParams.set('unreadOnly', 'true');
    } else {
      url.searchParams.delete('unreadOnly');
    }
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  }
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
      />
      Solo no leídas
    </label>
  );
}

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  async function handleClick() {
    await fetch('/api/proxy/notifications/read-all', { method: 'PATCH' });
    router.refresh();
  }
  if (disabled) return null;
  return (
    <button
      onClick={handleClick}
      className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
    >
      Marcar todas como leídas
    </button>
  );
}

export function NotificationItem({
  id,
  isRead,
  children,
}: {
  id: string;
  isRead: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  async function handleClick() {
    if (!isRead) {
      await fetch(`/api/proxy/notifications/${id}/read`, { method: 'PATCH' });
      router.refresh();
    }
  }
  return (
    <li
      onClick={handleClick}
      className={`flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors ${!isRead ? 'bg-violet-50/30' : ''}`}
    >
      {children}
    </li>
  );
}
