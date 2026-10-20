import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/security';

function devDetails(message: string) {
  if (process.env.NODE_ENV === 'production') return {};
  return { details: message };
}

interface AdminUserRow {
  id: string;
  email: string;
  criado_em: string;
}

// GET /api/admin
// Returns usage metrics and registered users list
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error: 'Supabase not configured',
        ...devDetails('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local'),
      },
      { status: 500 }
    );
  }

  try {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, criado_em')
      .order('criado_em', { ascending: false });

    if (usersError) {
      console.error('[api/admin] usuarios:', usersError.message);
      return NextResponse.json(
        { error: 'Could not load users', ...devDetails(usersError.message) },
        { status: 500 }
      );
    }

    const { data: calculos, error: calculosError } = await supabaseAdmin
      .from('calculos')
      .select('usuario_id');

    if (calculosError) {
      console.error('[api/admin] calculos:', calculosError.message);
      return NextResponse.json(
        { error: 'Could not load calculations', ...devDetails(calculosError.message) },
        { status: 500 }
      );
    }

    const calculosByUser = new Map<string, number>();
    for (const calculo of calculos ?? []) {
      const userId = String(calculo.usuario_id);
      calculosByUser.set(userId, (calculosByUser.get(userId) ?? 0) + 1);
    }

    const usuarios = ((users ?? []) as AdminUserRow[]).map((user) => ({
      id: user.id,
      email: user.email,
      criado_em: user.criado_em,
      total_calculos: calculosByUser.get(user.id) ?? 0,
    }));

    // Total de visitantes únicos
    const { count: totalVisitantes } = await supabaseAdmin
      .from('sessoes')
      .select('*', { count: 'exact', head: true });

    // Visitantes hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const { count: visitantesHoje } = await supabaseAdmin
      .from('sessoes')
      .select('*', { count: 'exact', head: true })
      .gte('primeiro_acesso', hoje.toISOString());

    // Cálculos anónimos — calcularam e saíram sem guardar
    const { count: calculosAnonimos } = await supabaseAdmin
      .from('calculos')
      .select('*', { count: 'exact', head: true })
      .is('usuario_id', null)
      .eq('guardado', false);

    // Cálculos guardados por utilizadores registados
    const { count: calculosGuardados } = await supabaseAdmin
      .from('calculos')
      .select('*', { count: 'exact', head: true })
      .eq('guardado', true);

    // Mobile vs Desktop
    const { data: dispositivosData } = await supabaseAdmin
      .from('sessoes')
      .select('dispositivo');

    const totalSessoes = dispositivosData?.length || 0;
    const mobile = dispositivosData?.filter((s) => s.dispositivo === 'mobile').length || 0;
    const desktop = totalSessoes - mobile;
    const percentMobile = totalSessoes > 0 ? Math.round((mobile / totalSessoes) * 100) : 0;

    // Funil
    const { count: sessoesComCalculo } = await supabaseAdmin
      .from('sessoes')
      .select('*', { count: 'exact', head: true })
      .gt('total_calculos', 0);

    const { data: guardadosPorUtilizador } = await supabaseAdmin
      .from('calculos')
      .select('usuario_id')
      .eq('guardado', true)
      .not('usuario_id', 'is', null);

    const utilizadoresComGuardado = new Set(
      (guardadosPorUtilizador ?? []).map((item) => String(item.usuario_id))
    ).size;

    return NextResponse.json({
      totais: {
        utilizadores: usuarios.length,
        calculos: calculos?.length ?? 0,
      },
      usuarios,
      analytics: {
        total_visitantes: totalVisitantes ?? 0,
        visitantes_hoje: visitantesHoje ?? 0,
        calculos_anonimos: calculosAnonimos ?? 0,
        calculos_guardados: calculosGuardados ?? 0,
        mobile,
        desktop,
        percent_mobile: percentMobile,
      },
      funil: {
        entraram_app: totalVisitantes ?? 0,
        fizeram_calculo: sessoesComCalculo ?? 0,
        calcularam_sem_guardar: calculosAnonimos ?? 0,
        guardaram_produto: utilizadoresComGuardado,
        registaram_email: usuarios.length,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'This action is disabled in this release.' },
    { status: 405 }
  );
}
