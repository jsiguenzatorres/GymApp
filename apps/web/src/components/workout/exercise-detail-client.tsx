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

// Extrae el ID de video de las variantes comunes de URL de YouTube:
// watch?v=ID, youtu.be/ID, embed/ID, shorts/ID. Retorna null si no matchea.
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1) || null;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const embedMatch = /^\/(?:embed|shorts)\/([^/?]+)/.exec(u.pathname);
      if (embedMatch) return embedMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

function isTikTokUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === 'tiktok.com' || host === 'vm.tiktok.com';
  } catch {
    return false;
  }
}

export function ExerciseVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const [error, setError] = useState(false);
  const youtubeId = extractYouTubeId(videoUrl);
  const isTikTok = isTikTokUrl(videoUrl);

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-bold text-foreground mb-3">🎥 Video técnico</h3>
      {isTikTok ? (
        // TikTok no tiene una URL de embed simple tipo iframe — su embed
        // oficial requiere cargar su script externo, fragil en una SPA.
        // Enlazamos directo al video en vez de intentar embeberlo inline.
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center transition-colors hover:bg-muted/50"
        >
          <span className="text-3xl">🎵</span>
          <span className="text-sm font-semibold text-foreground">Ver video en TikTok ↗</span>
          <span className="text-xs text-muted-foreground">Se abre en una pestaña nueva</span>
        </a>
      ) : youtubeId ? (
        // YouTube aloja el video — embebemos su reproductor oficial, no
        // descargamos ni copiamos el archivo.
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="Video técnico del ejercicio"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full rounded-lg"
          />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 text-center">
          No se pudo cargar el video. Revisa la URL (debe ser un link directo a archivo .mp4/.webm o
          una URL de YouTube).
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
