import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/auth/ativar-codigo
// Validates and activates a M-Pesa premium activation code
// The code is single-use and has a 7-day expiry
export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify authentication token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Step 2: Validate input
    const body = await request.json();
    const { codigo } = body;

    if (!codigo || typeof codigo !== 'string' || codigo.trim().length === 0 || codigo.length > 50) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const normalizedCode = codigo.trim().toUpperCase();

    // Step 3: Look up the code (service_role bypasses RLS)
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('codigos_ativacao')
      .select('id, usado, expira_em')
      .eq('codigo', normalizedCode)
      .maybeSingle();

    if (codeError || !codeRecord) {
      return NextResponse.json({ error: 'Invalid or unknown code' }, { status: 400 });
    }

    if (codeRecord.usado) {
      return NextResponse.json({ error: 'This code has already been used' }, { status: 400 });
    }

    if (codeRecord.expira_em && new Date(codeRecord.expira_em) < new Date()) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
    }

    // Step 4: Find the user record (support for pre-migration users)
    const { data: usuarioRecord } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .or(`id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (!usuarioRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 5: Activate premium for 30 days
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);

    await supabaseAdmin
      .from('usuarios')
      .update({
        plano: 'premium',
        premium_valido_ate: premiumUntil.toISOString(),
      })
      .eq('id', usuarioRecord.id);

    // Step 6: Mark the code as used
    await supabaseAdmin
      .from('codigos_ativacao')
      .update({
        usado: true,
        usado_em: new Date().toISOString(),
        usuario_id: usuarioRecord.id,
      })
      .eq('id', codeRecord.id);

    return NextResponse.json({
      success: true,
      valido_ate: premiumUntil.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
