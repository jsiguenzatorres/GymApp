'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-red-600">Error</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Algo salió mal</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ocurrió un error inesperado. Intenta de nuevo.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
