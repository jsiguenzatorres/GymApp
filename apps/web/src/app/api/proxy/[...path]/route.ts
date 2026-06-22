import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

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
