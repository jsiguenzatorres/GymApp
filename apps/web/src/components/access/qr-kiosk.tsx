'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
  return w.BarcodeDetector ?? null;
}

const RESULT_STYLES: Record<AccessResult, { bg: string; icon: string }> = {
  GRANTED: { bg: 'bg-emerald-600', icon: '✓' },
  DENIED_EXPIRED: { bg: 'bg-amber-600', icon: '⏱' },
  DENIED_INVALID: { bg: 'bg-red-600', icon: '✗' },
  DENIED_INACTIVE: { bg: 'bg-red-600', icon: '✗' },
  DENIED_NO_MEMBERSHIP: { bg: 'bg-red-600', icon: '✗' },
  DENIED_REPLAY: { bg: 'bg-amber-600', icon: '⚠' },
};

const RESULT_HOLD_MS = 2500;
const SCAN_INTERVAL_MS = 350;
const DUPLICATE_COOLDOWN_MS = 8000;

export function QrKiosk() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastPayloadRef = useRef<{ text: string; at: number } | null>(null);
  const busyRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [response, setResponse] = useState<ValidationResponse | null>(null);
  const [scanning, setScanning] = useState(true);

  // Abre la cámara trasera una sola vez
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      }
    }

    const Ctor = getBarcodeDetectorCtor();
    if (Ctor) {
      try {
        detectorRef.current = new Ctor({ formats: ['qr_code'] });
      } catch {
        detectorRef.current = null;
      }
    }

    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const validate = useCallback(async (payload: string) => {
    busyRef.current = true;
    setScanning(false);
    try {
      const res = await fetch('/api/proxy/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, deviceId: 'kiosk' }),
      });
      const data: ValidationResponse = await res.json();
      setResponse(data);
    } catch {
      setResponse({ result: 'DENIED_INVALID', message: 'Error de conexión' });
    } finally {
      setTimeout(() => {
        setResponse(null);
        busyRef.current = false;
        setScanning(true);
      }, RESULT_HOLD_MS);
    }
  }, []);

  const handleDecoded = useCallback(
    (text: string) => {
      if (busyRef.current) return;
      const now = Date.now();
      const last = lastPayloadRef.current;
      if (last && last.text === text && now - last.at < DUPLICATE_COOLDOWN_MS) return;
      lastPayloadRef.current = { text, at: now };
      void validate(text);
    },
    [validate],
  );

  // Bucle de escaneo — corre mientras no haya un resultado en pantalla
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let decodeQr:
      | ((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null)
      | null = null;

    async function tick() {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (detectorRef.current) {
          try {
            const codes = await detectorRef.current.detect(video);
            if (codes.length > 0) handleDecoded(codes[0].rawValue);
          } catch {
            // frame ilegible — se reintenta en el próximo tick
          }
        } else if (decodeQr) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx && canvas.width > 0 && canvas.height > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = decodeQr(imageData.data, imageData.width, imageData.height);
            if (code) handleDecoded(code.data);
          }
        }
      }

      if (!cancelled) timer = setTimeout(tick, SCAN_INTERVAL_MS);
    }

    async function boot() {
      if (!detectorRef.current) {
        const mod = await import('jsqr');
        decodeQr = mod.default;
      }
      if (!cancelled) void tick();
    }

    void boot();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [scanning, handleDecoded]);

  const style = response ? RESULT_STYLES[response.result] : null;

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {!response && !cameraError && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-3xl border-4 border-white/70 shadow-[0_0_0_2000px_rgba(0,0,0,0.35)]" />
          </div>
          <div className="absolute bottom-10 left-0 right-0 text-center text-lg font-medium text-white drop-shadow">
            Acerca tu código QR a la cámara
          </div>
        </>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8 text-center text-white">
          <p className="max-w-md text-lg">{cameraError}</p>
        </div>
      )}

      {response && style && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${style.bg} text-white`}
        >
          <span className="text-8xl font-bold">{style.icon}</span>
          {response.memberName && <p className="text-4xl font-bold">{response.memberName}</p>}
          <p className="text-xl">{response.message}</p>
        </div>
      )}
    </div>
  );
}
