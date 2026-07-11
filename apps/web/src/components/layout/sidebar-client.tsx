'use client';

import { signOut } from 'next-auth/react';
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
  Zap,
  ShoppingBag,
  Salad,
  Calendar,
  Trophy,
  UserPlus,
  MessageSquare,
  Newspaper,
  Target,
  Gift,
  Package,
  Megaphone,
  Repeat,
  Webhook,
  Tag,
  UserCheck,
  CalendarClock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // Operación diaria
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/access', label: 'Control de Acceso', icon: ScanLine },
  { href: '/members', label: 'Miembros', icon: Users },
  { href: '/payments', label: 'Pagos', icon: DollarSign },
  { href: '/crm', label: 'CRM / ARIA', icon: BrainCircuit },

  // Programas del gym
  { href: '/workouts', label: 'Entrenamiento', icon: Dumbbell },
  { href: '/workouts/zeus', label: 'ZEUS Coach IA', icon: Zap },
  { href: '/nutrition', label: 'Nutrición IA', icon: Salad },
  { href: '/crm/appointments', label: 'Citas', icon: CalendarClock },
  { href: '/classes', label: 'Clases & Horarios', icon: Calendar },
  { href: '/crm/pt-sessions', label: 'Sesiones PT', icon: UserCheck },

  // Comercial / ingresos
  { href: '/membership-types', label: 'Membresías', icon: CreditCard },
  { href: '/subscriptions', label: 'Suscripciones', icon: Repeat },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/monthly-boxes', label: 'Caja del mes', icon: Package },
  { href: '/coupons', label: 'Cupones', icon: Tag },

  // Comunidad / engagement
  { href: '/gamification', label: 'Gamificación', icon: Trophy },
  { href: '/challenges', label: 'Retos del gym', icon: Target },
  { href: '/rewards', label: 'Tienda recompensas', icon: Gift },
  { href: '/feedback', label: 'Feedback & NPS', icon: MessageSquare },
  { href: '/leads', label: 'Pipeline de Leads', icon: UserPlus },
  { href: '/blog', label: 'Blog', icon: Newspaper },

  // Administración (uso poco frecuente)
  { href: '/staff', label: 'Staff', icon: UserCog },
  { href: '/broadcast', label: 'Mensaje masivo', icon: Megaphone },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook },
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
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800 px-4">
        <img src="/logo-bagym.png" alt={gymName} className="h-11 w-11 rounded-full object-cover" />
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
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
