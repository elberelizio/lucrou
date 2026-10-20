import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIp } from '@/lib/analytics-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'avaliacoes', limit: 10, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { visitor_id, estrelas } = body;

    const stars = Number(estrelas);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Avaliação inválida' }, { status: 400 });
    }

    let usuarioId: string | null = null;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) usuarioId = user.id;
    }

    const ip = getClientIp(request);

    const { error } = await supabaseAdmin.from('avaliacoes').insert({
      visitor_id:
        typeof visitor_id === 'string' && visitor_id.length <= 100 ? visitor_id : null,
      usuario_id: usuarioId,
      estrelas: stars,
      ip_address: ip,
    });

    if (error) {
      console.error('[avaliacoes]', error);
      return NextResponse.json({ error: 'Não foi possível guardar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
