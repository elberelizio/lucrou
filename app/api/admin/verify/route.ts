import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword, isAdminAuthenticated } from '@/lib/security';

/** GET /api/admin/verify — só valida senha (não depende do Supabase) */
export async function GET(request: NextRequest) {
  if (!getAdminPassword()) {
    return NextResponse.json(
      {
        error: 'ADMIN_PASSWORD não configurada neste projecto Vercel (Production).',
        code: 'ADMIN_PASSWORD_MISSING',
      },
      { status: 503 }
    );
  }
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
