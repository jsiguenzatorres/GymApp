import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const SESSION_EXPIRED_MSG =
  'Tu sesión expiró. Recarga la página — si el problema persiste, cierra sesión y vuelve a iniciar.';

function sessionExpiredResponse() {
  return NextResponse.json({ message: SESSION_EXPIRED_MSG, sessionExpired: true }, { status: 401 });
}

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  // El callback jwt() en auth.ts marca session.error cuando el refresh
  // automatico del access token fallo (ej. race condition de refresh-token
  // rotation entre requests paralelas). Si sabemos de antemano que el token
  // es invalido, no tiene sentido ni llamar al backend — devolvemos el error
  // claro de una vez en lugar de dejar que el backend rechace con un mensaje
  // interno tipo "Token invalido o expirado" que no le dice al usuario qué hacer.
  if ((session as { error?: string }).error) {
    return sessionExpiredResponse();
  }

  const { path } = await params;
  const pathStr = path.join('/');
  const searchStr = req.nextUrl.search;
  const upstream = `${API_URL}/api/v1/${pathStr}${searchStr}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${(session as { accessToken?: string }).accessToken ?? ''}`,
  };

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const upstreamRes = await fetch(upstream, {
    method: req.method,
    headers,
    body,
  });

  // Access token rechazado por el backend (expiro justo antes de este
  // request, o el refresh en curso todavia no propago el nuevo token a esta
  // request paralela). Mensaje claro y accionable en vez del texto interno
  // del JwtStrategy del backend.
  if (upstreamRes.status === 401) {
    return sessionExpiredResponse();
  }

  const text = await upstreamRes.text();
  const responseInit = {
    status: upstreamRes.status,
    headers: { 'Content-Type': 'application/json' },
  };

  return new NextResponse(text || null, responseInit);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const PUT = handler;
