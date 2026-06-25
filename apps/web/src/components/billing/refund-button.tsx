'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Loader2 } from 'lucide-react';

export function RefundButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleRefund() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reembolso manual desde panel admin' }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        setError(d.message ?? 'Error al procesar el reembolso');
        setConfirmed(false);
      } else {
        router.refresh();
      }
    } catch {
      setError('Error de red');
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRefund}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          confirmed
            ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
            : 'border-gray-200 text-muted-foreground hover:bg-muted'
        }`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" />
        )}
        {confirmed ? 'Confirmar reembolso' : 'Reembolsar'}
      </button>
      {confirmed && !loading && (
        <button
          onClick={() => setConfirmed(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
