'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}

interface Props {
  memberId: string;
  initialUrl: string | null;
  initials: string;
}

export function MemberAvatarUploader({ memberId, initialUrl, initials }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no permitido (usa JPG, PNG o WebP)');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB, máx 2MB)`);
      return;
    }

    setUploading(true);
    try {
      const dataUri = await fileToDataUri(file);
      const res = await fetch(`/api/proxy/admin/members/${memberId}/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUri }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { avatar_url: string };
      setUrl(data.avatar_url);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-xl font-bold text-primary transition-opacity hover:opacity-90 disabled:cursor-wait"
        aria-label="Cambiar foto de perfil"
        title="Click para cambiar la foto"
      >
        {url ? <img src={url} alt={initials} className="h-full w-full object-cover" /> : initials}

        {/* Overlay hover con ícono de cámara */}
        {!uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <p className="absolute top-full mt-1 w-40 text-[11px] leading-tight text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
