'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
