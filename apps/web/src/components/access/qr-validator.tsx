'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type AccessResult =
  | 'GRANTED'
  | 'DENIED_EXPIRED'
  | 'DENIED_INVALID'
  | 'DENIED_INACTIVE'
  | 'DENIED_NO_MEMBERSHIP'
  | 'DENIED_REPLAY';

interface ValidationResponse {
  result: AccessResult;
  memberId?: string;
  memberName?: string;
  message: string;
}

const OVERRIDE_REASONS: { value: string; label: string }[] = [
  { value: 'CASH_PAYMENT_NOW', label: 'Pagó en efectivo en el momento' },
  { value: 'GRACE_PERIOD', label: 'Período de gracia autorizado (2-3 días)' },
  { value: 'TECHNICAL_ISSUE', label: 'Falla técnica del QR/sistema' },
  { value: 'OTHER', label: 'Otro motivo' },
];

// Solo tiene sentido anular rechazos ligados al miembro (membresía/pago) —
// DENIED_INVALID (QR ilegible/firma inválida) no siempre corresponde a un
// miembro real, así que no se ofrece override ahí.
const OVERRIDABLE_RESULTS: AccessResult[] = [
  'DENIED_INACTIVE',
  'DENIED_NO_MEMBERSHIP',
  'DENIED_EXPIRED',
  'DENIED_REPLAY',
];

const RESULT_STYLES: Record<
  AccessResult,
  { border: string; bg: string; icon: string; text: string }
> = {
  GRANTED: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-50',
    icon: '✓',
    text: 'text-emerald-700',
  },
  DENIED_EXPIRED: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    icon: '⏱',
    text: 'text-amber-700',
  },
  DENIED_INVALID: { border: 'border-red-400', bg: 'bg-red-50', icon: '✗', text: 'text-red-700' },
  DENIED_INACTIVE: { border: 'border-red-400', bg: 'bg-red-50', icon: '✗', text: 'text-red-700' },
  DENIED_NO_MEMBERSHIP: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    icon: '✗',
    text: 'text-red-700',
  },
  DENIED_REPLAY: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    icon: '⚠',
    text: 'text-amber-700',
  },
};

export function QrValidator() {
  const router = useRouter();
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ValidationResponse | null>(null);

  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState(OVERRIDE_REASONS[0].value);
  const [overrideNote, setOverrideNote] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!payload.trim()) return;
    setLoading(true);
    setResponse(null);
    setShowOverride(false);

    try {
      const res = await fetch('/api/proxy/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload.trim() }),
      });
      const data: ValidationResponse = await res.json();
      setResponse(data);
      if (data.result === 'GRANTED') {
        router.refresh();
        setTimeout(() => setResponse(null), 5000);
      }
    } catch {
      setResponse({ result: 'DENIED_INVALID', message: 'Error de conexión' });
    } finally {
      setLoading(false);
      setPayload('');
    }
  }

  async function handleOverride() {
    if (!response?.memberId) return;
    setOverrideLoading(true);
    try {
      const res = await fetch('/api/proxy/access/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: response.memberId,
          reason: overrideReason,
          note: overrideNote.trim() || undefined,
        }),
      });
      const data: ValidationResponse = await res.json();
      setResponse(data);
      setShowOverride(false);
      setOverrideNote('');
      if (data.result === 'GRANTED') {
        router.refresh();
        setTimeout(() => setResponse(null), 5000);
      }
    } catch {
      // deja el formulario abierto para reintentar
    } finally {
      setOverrideLoading(false);
    }
  }

  const style = response ? RESULT_STYLES[response.result] : null;
  const canOverride =
    response && response.memberId && OVERRIDABLE_RESULTS.includes(response.result);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900">Validar acceso manual</h2>
      <p className="mb-4 text-sm text-gray-500">
        Pega el payload del QR para verificar acceso (útil para pruebas o acceso manual por staff).
      </p>

      <form onSubmit={handleValidate} className="flex gap-3">
        <input
          type="text"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='{"v":1,"mid":"...","sig":"..."}'
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !payload.trim()}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Validar'}
        </button>
      </form>

      {response && style && (
        <div className={`mt-4 rounded-xl border-2 ${style.border} ${style.bg} p-5`}>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold ${style.text}`}>{style.icon}</span>
            <div>
              {response.memberName && (
                <p className={`text-lg font-bold ${style.text}`}>{response.memberName}</p>
              )}
              <p className={`text-sm ${style.text}`}>{response.message}</p>
            </div>
          </div>

          {canOverride && !showOverride && (
            <button
              type="button"
              onClick={() => setShowOverride(true)}
              className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Anular y permitir ingreso →
            </button>
          )}

          {canOverride && showOverride && (
            <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500">
                Quedará registrado con tu usuario en el historial de accesos.
              </p>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                disabled={overrideLoading}
              >
                {OVERRIDE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Nota opcional (ej. monto, fecha límite del período de gracia...)"
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400"
                disabled={overrideLoading}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOverride(false)}
                  disabled={overrideLoading}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleOverride}
                  disabled={overrideLoading}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {overrideLoading ? 'Autorizando…' : 'Confirmar ingreso manual'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── QR Display (genera y muestra QR de un miembro) ──────────────────────────

interface QrDisplayProps {
  memberId: string;
  memberName: string;
}

export function QrDisplay({ memberId, memberName }: QrDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  async function generateQr() {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/access/member/${memberId}/qr`);
      if (!res.ok) throw new Error();
      const data: { dataUrl: string; payload: string } = await res.json();
      setDataUrl(data.dataUrl);
      setSecondsLeft(60);

      const interval = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(interval);
            setDataUrl(null);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-700">
        QR de acceso para <strong>{memberName}</strong>
      </p>

      {dataUrl ? (
        <>
          <Image src={dataUrl} alt="QR de acceso" width={256} height={256} className="rounded-lg" />
          <div
            className={`flex items-center gap-2 text-sm font-medium ${secondsLeft <= 10 ? 'text-red-600' : 'text-emerald-600'}`}
          >
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
            Válido por {secondsLeft}s
          </div>
        </>
      ) : (
        <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-gray-50">
          <p className="text-xs text-gray-400">
            {secondsLeft === 0 ? 'QR expirado' : 'Sin QR generado'}
          </p>
        </div>
      )}

      <button
        onClick={generateQr}
        disabled={loading}
        className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? 'Generando…' : dataUrl ? 'Renovar QR' : 'Generar QR'}
      </button>
    </div>
  );
}
