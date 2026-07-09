'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, Loader2, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  user: { email: string };
  activeMembership: { id: string; type: { name: string } } | null;
}

const inputClass = cn(
  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
);

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function UploadVoucherForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async (value: string) => {
    setMemberSearch(value);
    setSelectedMember(null);
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Selecciona un miembro');
      return;
    }
    if (!file) {
      setError('Selecciona una imagen o PDF del comprobante');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const dataUri = await fileToDataUri(file);
      const res = await fetch('/api/proxy/payments/upload-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember.id,
          membershipId: selectedMember.activeMembership?.id,
          document: dataUri,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al subir el comprobante');
        return;
      }

      const created = (await res.json()) as { id: string };
      router.push(`/payments/${created.id}`);
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

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
            disabled={isUploading}
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
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedMember && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ {selectedMember.first_name} {selectedMember.last_name} seleccionado
          </p>
        )}
      </div>

      {/* Archivo */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Comprobante (imagen o PDF)</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-primary/5',
            file && 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
          )}
        >
          {file ? (
            <>
              <FileText className="h-8 w-8 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">Click para cambiar</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click para subir una foto o PDF del comprobante
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <p className="text-xs text-muted-foreground">
          Nuestro sistema leerá el documento y precargará los datos del pago — tú los revisas y
          confirmas antes de que cuente como cobro real.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.push('/payments')}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          disabled={isUploading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isUploading || !selectedMember || !file}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isUploading ? 'Leyendo comprobante...' : 'Subir y extraer datos'}
        </button>
      </div>
    </form>
  );
}
