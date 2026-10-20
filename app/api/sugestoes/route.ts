import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIp } from '@/lib/analytics-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { stripHtml } from '@/lib/security';

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'sugestoes', limit: 5, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { visitor_id, texto } = body;

    if (!texto || typeof texto !== 'string') {
      return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 });
    }

    const textoLimpo = stripHtml(texto);
    if (textoLimpo.length < 10) {
      return NextResponse.json({ error: 'Texto demasiado curto' }, { status: 400 });
    }
    if (textoLimpo.length > 2000) {
      return NextResponse.json({ error: 'Texto demasiado longo' }, { status: 400 });
    }

    const ip = getClientIp(request);

    const { error } = await supabaseAdmin.from('sugestoes').insert({
      visitor_id:
        typeof visitor_id === 'string' && visitor_id.length <= 100 ? visitor_id : null,
      texto: textoLimpo,
      ip_address: ip,
    });

    if (error) {
      console.error('[sugestoes]', error);
      return NextResponse.json({ error: 'Não foi possível guardar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
