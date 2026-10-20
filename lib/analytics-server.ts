import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'desconhecido';
  }
  return request.headers.get('x-real-ip') || 'desconhecido';
}

export function getClientCountry(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    null
  );
}
