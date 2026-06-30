'use client';

import { useEffect, useState } from 'react';

export function ExerciseImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 800);
    return () => clearInterval(t);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col items-center">
      <img
        src={images[idx]}
        alt="Demostración del ejercicio"
        className="w-full max-h-[360px] object-contain rounded-lg"
      />
      {images.length > 1 && (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          ● Posición {idx + 1} / {images.length}
        </p>
      )}
    </div>
  );
}

export function ExerciseVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const [error, setError] = useState(false);

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-bold text-foreground mb-3">🎥 Video técnico</h3>
      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 text-center">
          No se pudo cargar el video. Revisa la URL.
        </div>
      ) : (
        <video
          controls
          src={videoUrl}
          onError={() => setError(true)}
          className="w-full max-h-[400px] rounded-lg bg-black"
        >
          Tu navegador no soporta video HTML5.
        </video>
      )}
    </div>
  );
}
