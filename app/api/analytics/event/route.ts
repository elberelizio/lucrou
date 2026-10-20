import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIp } from '@/lib/analytics-server';
import { checkRateLimit } from '@/lib/rate-limit';

const TIPOS_VALIDOS = ['page_view', 'click', 'feature', 'session_end'] as const;

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'analytics-event', limit: 60, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { visitor_id, tipo, pagina, acao, detalhes } = body;

    if (!visitor_id || typeof visitor_id !== 'string' || visitor_id.length > 100) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const ip = getClientIp(request);

    const { error } = await supabaseAdmin.from('eventos_analytics').insert({
      visitor_id,
      tipo,
      pagina: typeof pagina === 'string' ? pagina.substring(0, 200) : null,
      acao: typeof acao === 'string' ? acao.substring(0, 200) : null,
      detalhes: detalhes && typeof detalhes === 'object' ? detalhes : {},
      ip_address: ip,
    });

    if (error) {
      return NextResponse.json({ error: 'Could not record' }, { status: 500 });
    }

    // Actualizar último acesso da sessão
    await supabaseAdmin
      .from('sessoes')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('visitor_id', visitor_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
