import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { FREE_PLAN_CALC_LIMIT, MODO_LANCAMENTO_GRATUITO } from '@/lib/limites';

// Helper: verify token and return the user's database record ID
async function getAuthenticatedUserId(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  // Support pre-migration users (their DB id may differ from auth uid)
  const { data: record } = await supabaseAdmin
    .from('usuarios')
    .select('id')
    .or(`id.eq.${user.id},email.eq.${user.email ?? ''}`)
    .maybeSingle();

  return record ? { userId: record.id, email: user.email ?? '' } : null;
}

// GET /api/calculos
// Returns the authenticated user's saved calculations
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUserId(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('plano')
      .eq('id', auth.userId)
      .single();

    const limit = (MODO_LANCAMENTO_GRATUITO || usuario?.plano === 'premium') ? 1000 : FREE_PLAN_CALC_LIMIT;

    const { data: calculos, error } = await supabaseAdmin
      .from('calculos')
      .select('*')
      .eq('usuario_id', auth.userId)
      .order('criado_em', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Could not load calculations' }, { status: 500 });
    }

    return NextResponse.json({ calculos: calculos ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/calculos
// Saves a new calculation to the database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await getAuthenticatedUserId(request);

    // Utilizador não autenticado — guardar com visitor_id
    if (!auth) {
      const { visitor_id, ...dadosProduto } = body;

      if (!visitor_id || typeof visitor_id !== 'string') {
        return NextResponse.json({ error: 'Invalid identifier' }, { status: 400 });
      }

      // Verificar limite de 10 produtos anónimos (desactivado em modo lançamento gratuito)
      if (!MODO_LANCAMENTO_GRATUITO) {
        const { count } = await supabaseAdmin
          .from('calculos')
          .select('*', { count: 'exact', head: true })
          .eq('visitor_id', visitor_id)
          .is('usuario_id', null)
          .eq('guardado', true);

        if ((count || 0) >= 10) {
          return NextResponse.json({
            error: 'limite_anonimo',
            mensagem: 'Anonymous save limit reached (10 products)',
          }, { status: 403 });
        }
      }

      // Guardar produto anónimo
      const { data, error } = await supabaseAdmin
        .from('calculos')
        .insert({
          visitor_id,
          nome_produto: dadosProduto.nome_produto?.trim(),
          unidades: dadosProduto.unidades,
          preco_compra: dadosProduto.preco_compra,
          custo_transporte: dadosProduto.custo_transporte || 0,
          outros_custos: dadosProduto.outros_custos || 0,
          lucro_percent: dadosProduto.lucro_percent,
          preco_recomendado: dadosProduto.preco_recomendado,
          lucro_por_unidade: dadosProduto.lucro_por_unidade,
          lucro_total: dadosProduto.lucro_total,
          modo: dadosProduto.modo,
          guardado: true,
        })
        .select('id')
        .single();

      if (error) {
        const msg = error.message ?? '';
        if (msg.includes('visitor_id') || msg.includes('guardado')) {
          return NextResponse.json(
            {
              error: 'schema_analytics',
              mensagem: 'Execute supabase_analytics.sql no Supabase para guardar sem email.',
            },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: 'Could not save' }, { status: 500 });
      }

      return NextResponse.json({ success: true, calculo_id: data.id });
    }

    if (body.calculo_id_anonimo && typeof body.calculo_id_anonimo === 'string') {
      const { data: atualizado, error: updateError } = await supabaseAdmin
        .from('calculos')
        .update({
          usuario_id: auth.userId,
          email_usuario: auth.email,
          guardado: true,
          visitor_id: null,
        })
        .eq('id', body.calculo_id_anonimo)
        .is('usuario_id', null)
        .select('id')
        .single();

      if (updateError || !atualizado) {
        return NextResponse.json({ error: 'Could not attach anonymous calculation' }, { status: 400 });
      }

      return NextResponse.json({ success: true, calculo: atualizado });
    }

    const {
      nome_produto,
      unidades,
      preco_compra,
      custo_transporte,
      outros_custos,
      lucro_percent,
      preco_recomendado,
      lucro_por_unidade,
      lucro_total,
      modo,
      preco_atual_cobrado,
    } = body;

    // Server-side validation — every field is checked independently
    if (!nome_produto || typeof nome_produto !== 'string' || nome_produto.trim().length < 1 || nome_produto.length > 200) {
      return NextResponse.json({ error: 'Invalid product name' }, { status: 400 });
    }
    if (!Number.isInteger(unidades) || unidades <= 0 || unidades > 100000) {
      return NextResponse.json({ error: 'Invalid number of units' }, { status: 400 });
    }
    if (typeof preco_compra !== 'number' || preco_compra <= 0 || preco_compra > 10000000) {
      return NextResponse.json({ error: 'Invalid purchase price' }, { status: 400 });
    }
    if (typeof custo_transporte !== 'number' || custo_transporte < 0) {
      return NextResponse.json({ error: 'Invalid shipping cost' }, { status: 400 });
    }
    if (typeof outros_custos !== 'number' || outros_custos < 0) {
      return NextResponse.json({ error: 'Invalid extra costs' }, { status: 400 });
    }
    if (typeof lucro_percent !== 'number' || lucro_percent < 0 || lucro_percent > 1000) {
      return NextResponse.json({ error: 'Invalid profit percentage' }, { status: 400 });
    }
    if (!['modoA', 'modoB'].includes(modo)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // Check free plan limit
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('plano')
      .eq('id', auth.userId)
      .single();

    if (!MODO_LANCAMENTO_GRATUITO && usuario?.plano === 'gratuito') {
      const { count } = await supabaseAdmin
        .from('calculos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', auth.userId);

      if ((count ?? 0) >= FREE_PLAN_CALC_LIMIT) {
        return NextResponse.json(
          { error: 'Temporary limit reached', upgrade: true },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('calculos')
      .insert({
        usuario_id: auth.userId,
        email_usuario: auth.email,
        nome_produto: nome_produto.trim(),
        unidades,
        preco_compra,
        custo_transporte,
        outros_custos,
        lucro_percent,
        preco_recomendado,
        lucro_por_unidade,
        lucro_total,
        modo,
        preco_atual_cobrado: preco_atual_cobrado ?? null,
        stock_atual: 0,
        guardado: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Could not save calculation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, calculo: data });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
