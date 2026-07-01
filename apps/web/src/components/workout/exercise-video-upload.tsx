'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, Video } from 'lucide-react';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}

interface Props {
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export function ExerciseVideoUpload({ onUploaded, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no permitido. Usa MP4, WebM o MOV.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `Video muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB, máx ${MAX_BYTES / 1024 / 1024}MB). Recorta el clip.`,
      );
      return;
    }

    setUploading(true);
    try {
      const dataUri = await fileToDataUri(file);
      const res = await fetch('/api/proxy/exercises/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video: dataUri }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { url: string };
      onUploaded(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir el video');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        disabled={disabled || uploading}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Video className="h-3.5 w-3.5" />
        )}
        {uploading ? 'Subiendo...' : 'O sube tu propio video (clip de técnica grabado por el gym)'}
        {!uploading && <Upload className="h-3 w-3" />}
      </button>
      <p className="text-[11px] text-muted-foreground">
        MP4/WebM/MOV, máx 15MB. Solo para contenido propio — no descargues videos de redes sociales,
        usa el campo de arriba con un link de YouTube en su lugar.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
