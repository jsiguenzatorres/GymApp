'use client';
import { useState, useTransition } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CreditTransaction {
  id: string;
  kind: 'CHARGE' | 'PAYMENT' | 'USE' | 'REFUND';
  amount_usd: string | number;
  balance_after: string | number;
  note: string | null;
  related_order_id: string | null;
  created_at: string;
}

const KIND_META: Record<
  CreditTransaction['kind'],
  { label: string; color: string; icon: 'up' | 'down' }
> = {
  CHARGE: { label: 'Cargo (deuda)', color: 'text-red-600', icon: 'down' },
  PAYMENT: { label: 'Pago recibido', color: 'text-emerald-600', icon: 'up' },
  USE: { label: 'Usado en compra', color: 'text-amber-600', icon: 'down' },
  REFUND: { label: 'Reembolso', color: 'text-blue-600', icon: 'up' },
};

interface Props {
  memberId: string;
  initialBalance: number;
  initialHistory: CreditTransaction[];
  fetchAction: (memberId: string) => Promise<{ balance: number; history: CreditTransaction[] }>;
  createAction: (memberId: string, fd: FormData) => Promise<{ ok: boolean; error?: string }>;
}

export function CreditSection({
  memberId,
  initialBalance,
  initialHistory,
  fetchAction,
  createAction,
}: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState(initialHistory);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<CreditTransaction['kind']>('PAYMENT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const refresh = async () => {
    const fresh = await fetchAction(memberId);
    setBalance(fresh.balance);
    setHistory(fresh.history);
  };

  const submit = () => {
    setError(null);
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt === 0) {
      setError('Monto inválido (debe ser un número distinto de 0)');
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      // CHARGE/USE = deuda → amount negativo
      // PAYMENT/REFUND = abono → amount positivo
      const signed = kind === 'CHARGE' || kind === 'USE' ? -Math.abs(amt) : Math.abs(amt);
      fd.set('kind', kind);
      fd.set('amount_usd', String(signed));
      if (note.trim()) fd.set('note', note.trim());
      const res = await createAction(memberId, fd);
      if (res.ok) {
        setOpen(false);
        setAmount('');
        setNote('');
        await refresh();
      } else {
        setError(res.error ?? 'Error');
      }
    });
  };

  const isDebt = balance < 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          💳 Crédito en cuenta
        </h2>
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
        >
          {open ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {open ? 'Cerrar' : 'Movimiento'}
        </button>
      </div>

      {/* Saldo */}
      <div
        className={`mb-4 flex items-center justify-between rounded-lg p-4 ${
          isDebt ? 'bg-red-50' : balance > 0 ? 'bg-emerald-50' : 'bg-gray-50'
        }`}
      >
        <div>
          <p className="text-xs font-semibold text-gray-600">
            {isDebt ? 'Adeudo con el gym' : 'Saldo a favor'}
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${
              isDebt ? 'text-red-700' : balance > 0 ? 'text-emerald-700' : 'text-gray-700'
            }`}
          >
            {isDebt ? '-' : ''}${Math.abs(balance).toFixed(2)}
          </p>
        </div>
        <span className="text-3xl">{isDebt ? '⚠️' : '💳'}</span>
      </div>

      {/* Form nuevo movimiento */}
      {open && (
        <div className="mb-4 space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">Tipo</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as CreditTransaction['kind'])}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="PAYMENT">Pago recibido (abona saldo)</option>
              <option value="REFUND">Reembolso (abona saldo)</option>
              <option value="CHARGE">Cargo (deuda al miembro)</option>
              <option value="USE">Usado en compra (deuda)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Monto USD *</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0.01"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="25.00"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Nota (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Pago en efectivo en recepción"
            />
          </div>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={submit}
            disabled={pending || !amount}
            className="w-full rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? 'Guardando…' : 'Registrar movimiento'}
          </button>
        </div>
      )}

      {/* Historial */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Historial reciente
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400">Sin movimientos todavía.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.slice(0, 10).map((tx) => {
              const meta = KIND_META[tx.kind];
              const amt = Number(tx.amount_usd);
              return (
                <li key={tx.id} className="flex items-center gap-3 py-2">
                  {meta.icon === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">{meta.label}</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(tx.created_at).toLocaleString('es-SV', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {tx.note && ` · ${tx.note}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${meta.color}`}>
                      {amt > 0 ? '+' : ''}${amt.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      → ${Number(tx.balance_after).toFixed(2)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
