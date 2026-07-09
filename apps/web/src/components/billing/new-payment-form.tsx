'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, CheckCircle2, Loader2, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  dui: string | null;
  dui_expiration: string | null;
  address: string | null;
  is_taxpayer: boolean;
  nit: string | null;
  nrc: string | null;
  user: { email: string };
  activeMembership: {
    id: string;
    type: { name: string };
    end_date: string;
    price_paid?: string;
  } | null;
}

const PAYMENT_TYPES = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta (terminal POS)' },
  { value: 'BANK_TRANSFER', label: 'Transferencia bancaria' },
  { value: 'OTHER', label: 'Otro' },
];

const INVOICE_TYPES = [
  { value: '', label: 'Sin factura' },
  { value: 'CF', label: 'CF — Consumidor Final' },
  { value: 'CCF', label: 'CCF — Crédito Fiscal' },
];

const inputClass = cn(
  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function NewPaymentForm() {
  const router = useRouter();

  // Member search
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);

  // Form state — pago
  const [form, setForm] = useState({
    membershipId: '',
    amount: '',
    subtotal: '',
    taxAmount: '',
    voucherNumber: '',
    paymentType: 'CASH',
    invoiceType: '',
    description: '',
    notes: '',
    paidAt: new Date().toISOString().slice(0, 16),
  });

  // Form state — datos fiscales del miembro (se guardan en su perfil)
  const [fiscal, setFiscal] = useState({
    dui: '',
    duiExpiration: '',
    address: '',
    isTaxpayer: false,
    nit: '',
    nrc: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search members
  const handleSearch = useCallback(async (value: string) => {
    setMemberSearch(value);
    setSelectedMember(null);
    setForm((prev) => ({ ...prev, membershipId: '', amount: '' }));

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/proxy/members?search=${encodeURIComponent(value)}&limit=5`);
      if (res.ok) {
        const data = (await res.json()) as { data: MemberSearchResult[] };
        setSearchResults(data.data ?? []);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setMemberSearch(`${member.first_name} ${member.last_name}`);
    setSearchResults([]);

    setFiscal({
      dui: member.dui ?? '',
      duiExpiration: member.dui_expiration ? member.dui_expiration.slice(0, 10) : '',
      address: member.address ?? '',
      isTaxpayer: member.is_taxpayer,
      nit: member.nit ?? '',
      nrc: member.nrc ?? '',
    });

    // Auto-fill si tiene membresía activa
    const activeMembership = member.activeMembership;
    if (activeMembership) {
      setForm((prev) => ({
        ...prev,
        membershipId: activeMembership.id,
        amount: activeMembership.price_paid?.toString() ?? '',
        description: activeMembership.type.name,
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subtotal = e.target.value;
    setForm((prev) => {
      const sub = Number(subtotal);
      if (subtotal === '' || Number.isNaN(sub)) {
        return { ...prev, subtotal, taxAmount: '', amount: '' };
      }
      const tax = round2(sub * 0.13);
      const total = round2(sub + tax);
      return { ...prev, subtotal, taxAmount: tax.toFixed(2), amount: total.toFixed(2) };
    });
    setError('');
  };

  const handleFiscalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFiscal((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Selecciona un miembro');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Si cambió algún dato fiscal del miembro, lo guardamos en su perfil
      const fiscalChanged =
        fiscal.dui !== (selectedMember.dui ?? '') ||
        fiscal.duiExpiration !== (selectedMember.dui_expiration?.slice(0, 10) ?? '') ||
        fiscal.address !== (selectedMember.address ?? '') ||
        fiscal.isTaxpayer !== selectedMember.is_taxpayer ||
        fiscal.nit !== (selectedMember.nit ?? '') ||
        fiscal.nrc !== (selectedMember.nrc ?? '');

      if (fiscalChanged) {
        await fetch(`/api/proxy/members/${selectedMember.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dui: fiscal.dui || undefined,
            duiExpiration: fiscal.duiExpiration || undefined,
            address: fiscal.address || undefined,
            isTaxpayer: fiscal.isTaxpayer,
            nit: fiscal.nit || undefined,
            nrc: fiscal.nrc || undefined,
          }),
        });
      }

      const res = await fetch('/api/proxy/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember.id,
          membershipId: form.membershipId || undefined,
          amount: Number(form.amount),
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          taxAmount: form.taxAmount ? Number(form.taxAmount) : undefined,
          voucherNumber: form.voucherNumber || undefined,
          paymentType: form.paymentType,
          invoiceType: form.invoiceType || undefined,
          description: form.description || undefined,
          notes: form.notes || undefined,
          paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al registrar el pago');
        return;
      }

      setSuccess('Pago registrado exitosamente');
      setTimeout(() => router.push('/payments'), 1500);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">{success}</p>
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6">
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Miembro */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Miembro</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className={cn(inputClass, 'pl-9')}
            disabled={isLoading}
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg">
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMember(m)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {m.first_name[0]}
                    {m.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  {m.activeMembership && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {m.activeMembership.type.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedMember && (
          <div className="rounded-lg border bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ✓ {selectedMember.first_name} {selectedMember.last_name} seleccionado
              {selectedMember.activeMembership && (
                <span className="font-normal text-muted-foreground">
                  {' '}
                  — Plan: {selectedMember.activeMembership.type.name}
                </span>
              )}
            </p>
            <p className="mt-1">
              {selectedMember.user.email} · {selectedMember.phone ?? 'sin teléfono registrado'}
            </p>
          </div>
        )}
      </div>

      {/* Datos fiscales del miembro (El Salvador) */}
      {selectedMember && (
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Identidad y facturación del miembro</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">DUI</label>
              <input
                name="dui"
                value={fiscal.dui}
                onChange={handleFiscalChange}
                placeholder="00000000-0"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Fecha de expiración DUI
              </label>
              <input
                name="duiExpiration"
                type="date"
                value={fiscal.duiExpiration}
                onChange={handleFiscalChange}
                className={inputClass}
                disabled={isLoading}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dirección</label>
              <input
                name="address"
                value={fiscal.address}
                onChange={handleFiscalChange}
                placeholder="Dirección completa"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isTaxpayer"
              checked={fiscal.isTaxpayer}
              onChange={handleFiscalChange}
              disabled={isLoading}
              className="h-4 w-4 rounded border-input"
            />
            Es contribuyente (requiere Crédito Fiscal / CCF)
          </label>

          {fiscal.isTaxpayer && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">NIT</label>
                <input
                  name="nit"
                  value={fiscal.nit}
                  onChange={handleFiscalChange}
                  placeholder="0000-000000-000-0"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">NRC</label>
                <input
                  name="nrc"
                  value={fiscal.nrc}
                  onChange={handleFiscalChange}
                  placeholder="000000"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprobante */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5" />
          Número de comprobante{' '}
          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input
          name="voucherNumber"
          type="text"
          value={form.voucherNumber}
          onChange={handleChange}
          placeholder="Ej. 000123"
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      {/* Desglose de impuestos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Subtotal <span className="text-xs font-normal text-muted-foreground">(sin IVA)</span>
          </label>
          <input
            name="subtotal"
            type="number"
            min="0"
            step="0.01"
            value={form.subtotal}
            onChange={handleSubtotalChange}
            placeholder="0.00"
            className={inputClass}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">IVA (13%)</label>
          <input
            name="taxAmount"
            type="number"
            value={form.taxAmount}
            readOnly
            placeholder="0.00"
            className={cn(inputClass, 'bg-muted/50')}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Valor total *</label>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass}
            disabled={isLoading}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Escribe el subtotal para calcular el IVA automáticamente, o ingresa el valor total
        directamente si no necesitas el desglose.
      </p>

      {/* Método de pago */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Método de pago</label>
        <select
          name="paymentType"
          value={form.paymentType}
          onChange={handleChange}
          className={inputClass}
          disabled={isLoading}
        >
          {PAYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Descripción <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input
          name="description"
          type="text"
          value={form.description}
          onChange={handleChange}
          placeholder="Mensualidad octubre 2025, day pass, etc."
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      {/* Fecha del pago + Factura */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha y hora</label>
          <input
            name="paidAt"
            type="datetime-local"
            value={form.paidAt}
            onChange={handleChange}
            className={inputClass}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de factura</label>
          <select
            name="invoiceType"
            value={form.invoiceType}
            onChange={handleChange}
            className={inputClass}
            disabled={isLoading}
          >
            {INVOICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notas internas */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Notas internas{' '}
          <span className="text-xs font-normal text-muted-foreground">
            (solo visible para staff)
          </span>
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Notas sobre este pago..."
          rows={2}
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.push('/payments')}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || !selectedMember || !form.amount}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Registrando...' : 'Registrar pago'}
        </button>
      </div>
    </form>
  );
}
