import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { STOCK_LOW_THRESHOLD } from '@/lib/limites';
import { StockStatus } from '@/lib/types';

// POST /api/stock/movimento
// Records a stock entry (entrada) or exit (saida) for a saved product
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get the user's database record ID
    const { data: userRecord } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .or(`id.eq.${user.id},email.eq.${user.email ?? ''}`)
      .maybeSingle();

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { calculo_id, tipo, quantidade, observacao } = body;

    // Validation
    if (!calculo_id || typeof calculo_id !== 'string') {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }
    if (!['entrada', 'saida'].includes(tipo)) {
      return NextResponse.json({ error: 'Type must be "entrada" or "saida"' }, { status: 400 });
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0 || quantidade > 10000) {
      return NextResponse.json({ error: 'Invalid quantity (1 to 10000)' }, { status: 400 });
    }

    // Verify the product belongs to this user
    const { data: calculo } = await supabaseAdmin
      .from('calculos')
      .select('id, stock_atual')
      .eq('id', calculo_id)
      .eq('usuario_id', userRecord.id)
      .maybeSingle();

    if (!calculo) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate new stock (never goes below zero)
    const currentStock = calculo.stock_atual ?? 0;
    const newStock = tipo === 'entrada'
      ? currentStock + quantidade
      : Math.max(0, currentStock - quantidade);

    // Determine stock status
    const stockStatus: StockStatus = newStock === 0
      ? 'esgotado'
      : newStock <= STOCK_LOW_THRESHOLD
      ? 'baixo'
      : 'disponivel';

    // Record the movement
    await supabaseAdmin
      .from('movimentos_stock')
      .insert({
        calculo_id,
        usuario_id: userRecord.id,
        tipo,
        quantidade,
        observacao: observacao?.trim() ?? null,
      });

    // Update stock on the calculation record
    await supabaseAdmin
      .from('calculos')
      .update({ stock_atual: newStock })
      .eq('id', calculo_id);

    return NextResponse.json({ success: true, stock_atual: newStock, stock_status: stockStatus });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
