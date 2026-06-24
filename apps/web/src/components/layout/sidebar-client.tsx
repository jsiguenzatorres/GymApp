'use client';

import Link from 'next/link';
import { NavLink } from './nav-link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Dumbbell,
  BrainCircuit,
  BarChart3,
  ScanLine,
  UserCog,
  Settings,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Miembros', icon: Users },
  { href: '/staff', label: 'Staff', icon: UserCog },
  { href: '/membership-types', label: 'Membresías', icon: CreditCard },
  { href: '/payments', label: 'Pagos', icon: DollarSign },
  { href: '/workouts', label: 'Entrenamiento', icon: Dumbbell },
  { href: '/access', label: 'Control de Acceso', icon: ScanLine },
  { href: '/crm', label: 'CRM / ARIA', icon: BrainCircuit },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

interface SidebarClientProps {
  userName: string;
  userEmail: string;
  gymName?: string;
}

export function SidebarClient({ userName, userEmail, gymName = 'GymApp' }: SidebarClientProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-zinc-950 text-zinc-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-5">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <span className="block h-5 w-1.5 rounded-sm bg-violet-500" />
            <span className="block h-5 w-1.5 rounded-sm bg-violet-500" />
          </div>
          <span className="block h-2.5 w-2 rounded-sm bg-amber-400" />
          <div className="flex gap-0.5">
            <span className="block h-5 w-1.5 rounded-sm bg-violet-500" />
          </div>
        </div>
        <span className="font-bold text-sm tracking-tight text-zinc-50">{gymName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} soon={item.soon}>
            {item.label}
          </NavLink>
        ))}

        <div className="my-3 border-t border-zinc-800" />

        <NavLink href="/settings" icon={Settings}>
          Configuración
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">{userName}</p>
            <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="rounded p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
