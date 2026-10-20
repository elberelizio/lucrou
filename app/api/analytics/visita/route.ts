import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientCountry, getClientIp } from '@/lib/analytics-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'analytics-visita', limit: 30, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { visitor_id, dispositivo, user_agent, largura_ecra, referrer } = body;
    const ip = getClientIp(request);
    const pais = getClientCountry(request);

    if (!visitor_id || typeof visitor_id !== 'string' || visitor_id.length > 100) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }

    // Verificar se sessão já existe
    const { data: sessaoExistente } = await supabaseAdmin
      .from('sessoes')
      .select('id')
      .eq('visitor_id', visitor_id)
      .maybeSingle();

    const agora = new Date().toISOString();

    const sessaoUpdate = {
      ultimo_acesso: agora,
      ip_address: ip,
      ...(pais ? { pais } : {}),
      ...(typeof largura_ecra === 'number' ? { largura_ecra } : {}),
    };

    if (sessaoExistente) {
      await supabaseAdmin
        .from('sessoes')
        .update(sessaoUpdate)
        .eq('visitor_id', visitor_id);
    } else {
      await supabaseAdmin.from('sessoes').insert({
        visitor_id,
        primeiro_acesso: agora,
        ultimo_acesso: agora,
        dispositivo: ['mobile', 'desktop'].includes(dispositivo) ? dispositivo : 'desktop',
        user_agent: typeof user_agent === 'string' ? user_agent.substring(0, 300) : null,
        ip_address: ip,
        pais: pais || null,
        referrer: typeof referrer === 'string' ? referrer.substring(0, 500) : null,
        largura_ecra: typeof largura_ecra === 'number' ? largura_ecra : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
