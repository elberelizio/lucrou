import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/auth/me
// Returns the authenticated user's data and calculation count
// Called by useAuth hook after login
export async function GET(request: NextRequest) {
  try {
    // Step 1: Verify the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Step 2: Look up user record — first by auth UID, then by email (migration support)
    let usuario = null;

    const { data: byId } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nome, nome_negocio, plano, criado_em, ultimo_acesso, premium_valido_ate')
      .eq('id', user.id)
      .maybeSingle();

    if (byId) {
      usuario = byId;
    } else {
      // Existing users created before auth migration — look up by email
      const { data: byEmail } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, nome, nome_negocio, plano, criado_em, ultimo_acesso, premium_valido_ate')
        .eq('email', user.email ?? '')
        .maybeSingle();

      usuario = byEmail;
    }

    // Step 3: First time login — create user record
    if (!usuario) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: user.id,
          email: user.email,
          plano: 'gratuito',
          ultimo_acesso: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Could not load data' }, { status: 500 });
      }

      return NextResponse.json({ usuario: newUser, totalCalculos: 0 });
    }

    // Step 4: Check if premium has expired
    if (usuario.plano === 'premium' && usuario.premium_valido_ate) {
      const expired = new Date(usuario.premium_valido_ate) < new Date();
      if (expired) {
        await supabaseAdmin
          .from('usuarios')
          .update({ plano: 'gratuito', premium_valido_ate: null })
          .eq('id', usuario.id);
        usuario.plano = 'gratuito';
        usuario.premium_valido_ate = null;
      }
    }

    // Step 5: Update last access timestamp
    await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', usuario.id);

    // Migrar produtos anónimos se vier visitor_id no header
    const visitorId = request.headers.get('x-visitor-id');

    if (visitorId && user.id) {
      // Migrar todos os cálculos anónimos deste visitor_id para o utilizador
      await supabaseAdmin
        .from('calculos')
        .update({
          usuario_id: user.id,
          email_usuario: user.email,
          visitor_id: null,
        })
        .eq('visitor_id', visitorId)
        .is('usuario_id', null)
        .eq('guardado', true);

      // Migrar também a sessão anónima
      await supabaseAdmin
        .from('sessoes')
        .update({ usuario_id: user.id })
        .eq('visitor_id', visitorId)
        .is('usuario_id', null);
    }

    // Step 6: Count calculations
    const { count } = await supabaseAdmin
      .from('calculos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuario.id);

    return NextResponse.json({ usuario, totalCalculos: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
