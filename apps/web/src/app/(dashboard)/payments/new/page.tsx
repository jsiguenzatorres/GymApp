import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NewPaymentForm } from '@/components/billing/new-payment-form';

export const metadata: Metadata = { title: 'Registrar Pago — GymApp' };

export default function NewPaymentPage() {
  return (
    <div className="max-w-xl space-y-6">
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pagos
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrar Pago</h1>
        <p className="text-sm text-muted-foreground">Cobra en efectivo, tarjeta o transferencia</p>
      </div>

      <NewPaymentForm />
    </div>
  );
}
