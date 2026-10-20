import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      visitor_id,
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
    } = body;

    // Validação básica
    if (!visitor_id || typeof visitor_id !== 'string') {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }
    if (!nome_produto || typeof nome_produto !== 'string') {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }
    if (!Number.isInteger(unidades) || unidades <= 0) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }
    if (typeof preco_compra !== 'number' || preco_compra <= 0) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }
    if (!['modoA', 'modoB'].includes(modo)) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }

    // Inserir cálculo anónimo
    const { data, error } = await supabaseAdmin
      .from('calculos')
      .insert({
        visitor_id,
        nome_produto: nome_produto.trim().substring(0, 200),
        unidades,
        preco_compra,
        custo_transporte: custo_transporte || 0,
        outros_custos: outros_custos || 0,
        lucro_percent,
        preco_recomendado,
        lucro_por_unidade,
        lucro_total,
        modo,
        guardado: false,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Could not record' }, { status: 500 });
    }

    // Actualizar contador de cálculos na sessão
    await supabaseAdmin.rpc('incrementar_calculos_sessao', {
      p_visitor_id: visitor_id,
    });

    return NextResponse.json({ success: true, calculo_id: data.id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
