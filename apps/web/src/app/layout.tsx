import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'GymApp Admin', template: '%s | GymApp' },
  description: 'Panel administrativo — GymApp Plataforma de Gestión de Gimnasios',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
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
      </body>
    </html>
  );
}
