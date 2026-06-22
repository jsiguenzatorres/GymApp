'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  soon?: boolean;
}

export function NavLink({ href, icon: Icon, children, soon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  if (soon) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 cursor-not-allowed">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{children}</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-500">
          Pronto
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-violet-600/20 text-violet-300 font-medium'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
    </Link>
  );
}
