import Link from 'next/link';

// Anula el `force-dynamic` heredado del layout raíz — la 404 no necesita
// datos dinámicos, y heredarlo rompe la generación estática interna que
// Next.js hace de esta página durante `next build` (error "<Html> should
// not be imported outside of pages/_document").
export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        Página no encontrada
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
