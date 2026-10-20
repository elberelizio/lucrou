import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/analytics-server';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Limpa entradas expiradas de forma ocasional (serverless-friendly). */
function cleanup(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Rate limit em memória por IP + rota.
 * Em serverless o limite é por instância (não global), mas bloqueia abuso básico.
 */
export function checkRateLimit(
  request: NextRequest,
  opts: { key: string; limit: number; windowMs: number }
): { ok: true } | { ok: false; response: NextResponse } {
  const now = Date.now();
  cleanup(now);

  const ip = getClientIp(request);
  const mapKey = `${opts.key}:${ip}`;
  const current = buckets.get(mapKey);

  if (!current || current.resetAt <= now) {
    buckets.set(mapKey, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (current.count >= opts.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Demasiados pedidos. Tenta novamente dentro de momentos.', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      ),
    };
  }

  current.count += 1;
  buckets.set(mapKey, current);
  return { ok: true };
}
