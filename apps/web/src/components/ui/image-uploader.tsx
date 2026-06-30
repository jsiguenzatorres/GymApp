'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

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
  value?: string | null;
  onChange: (url: string | null) => void;
  uploadUrl: string;
  label?: string;
  disabled?: boolean;
}

export function ImageUploader({ value, onChange, uploadUrl, label = 'Imagen', disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Formato no permitido. Usa JPG, PNG o WebP.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`Imagen muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máx 2MB)`);
        return;
      }

      setUploading(true);
      try {
        const dataUri = await fileToDataUri(file);
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUri }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? `Error ${res.status}`);
        }
        const data = (await res.json()) as { url: string };
        onChange(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al subir');
      } finally {
        setUploading(false);
      }
    },
    [onChange, uploadUrl],
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const remove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">{label}</label>

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="h-32 w-32 rounded-lg border object-cover" />
          <button
            type="button"
            onClick={remove}
            disabled={disabled || uploading}
            className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white shadow-md hover:bg-red-700 disabled:opacity-50"
            aria-label="Eliminar imagen"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${
            dragging
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/30'
          } ${disabled || uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
              <p className="text-xs text-gray-600">Subiendo...</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-500">
                <ImageIcon className="h-5 w-5" />
                <Upload className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-700 text-center">
                Arrastra una imagen aquí o{' '}
                <span className="text-violet-600">click para elegir</span>
              </p>
              <p className="text-[10px] text-gray-400">JPG, PNG, WebP · máx 2MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
