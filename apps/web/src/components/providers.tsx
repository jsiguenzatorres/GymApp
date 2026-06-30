'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
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
    </ThemeProvider>
  );
}
