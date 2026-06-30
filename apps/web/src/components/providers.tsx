'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Lazy + client-only: Toaster nunca corre en SSR/prerender,
// evita el bug "useRef null" en /404 prerender de Next.js 15.
const Toaster = dynamic(() => import('sonner').then((m) => m.Toaster), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'font-sans',
          },
        }}
      />
    </>
  );
}
