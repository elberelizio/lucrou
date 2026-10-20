import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/calculos/count
// Returns how many calculations the authenticated user has saved
export async function GET(request: NextRequest) {
  try {
    // Se vier visitor_id no query string — contar produtos anónimos
    const visitorId = request.nextUrl.searchParams.get('visitor_id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (visitorId && !token) {
      const { count } = await supabaseAdmin
        .from('calculos')
        .select('*', { count: 'exact', head: true })
        .eq('visitor_id', visitorId)
        .is('usuario_id', null)
        .eq('guardado', true);

      return NextResponse.json({ total: count || 0 });
    }

    if (!token) {
      return NextResponse.json({ total: 0 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: record } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .or(`id.eq.${user.id},email.eq.${user.email ?? ''}`)
      .maybeSingle();

    if (!record) {
      return NextResponse.json({ total: 0 });
    }

    const { count, error } = await supabaseAdmin
      .from('calculos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', record.id);

    if (error) {
      return NextResponse.json({ error: 'Could not count' }, { status: 500 });
    }

    return NextResponse.json({ total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
