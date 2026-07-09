import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UploadVoucherForm } from '@/components/billing/upload-voucher-form';

export const metadata: Metadata = { title: 'Subir Comprobante — GymApp' };

export default function UploadVoucherPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Subir Comprobante</h1>
        <p className="text-sm text-muted-foreground">
          Sube una foto o PDF del recibo — la IA extrae los datos y los deja listos para tu revisión
        </p>
      </div>

      <UploadVoucherForm />
    </div>
  );
}
