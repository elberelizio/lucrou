import { NextRequest, NextResponse } from 'next/server';
import { findAuthUserByEmail, isAuthEmailExistsError } from '@/lib/auth-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { validatePasswordStrength } from '@/lib/security';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/auth/register
// Creates a premium account with email + password
// Also handles existing users (magic link users upgrading to premium)
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'auth-register', limit: 5, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { email, password, nome, nomeNegocio } = body;

    // Server-side validation — never trust the client
    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2 || nome.length > 100) {
      return NextResponse.json({ error: 'Invalid name (minimum 2 characters)' }, { status: 400 });
    }
    if (!nomeNegocio || typeof nomeNegocio !== 'string' || nomeNegocio.trim().length < 2 || nomeNegocio.length > 100) {
      return NextResponse.json({ error: 'Invalid business name (minimum 2 characters)' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();
    const cleanNomeNegocio = nomeNegocio.trim();

    let authUserId: string;

    // Try to create auth account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true, // skip email confirmation
    });

    if (authError) {
      if (!isAuthEmailExistsError(authError)) {
        console.error('[register] createUser:', authError.message);
        return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
      }

      const { data: existing } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        authUserId = existing.id;
      } else {
        const authUser = await findAuthUserByEmail(cleanEmail);
        if (!authUser) {
          return NextResponse.json({ error: 'Account not found. Contact support.' }, { status: 400 });
        }
        authUserId = authUser.id;
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
      });

      if (updateError) {
        console.error('[register] updateUser:', updateError.message);
        return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
      }
    } else {
      if (!authData.user?.id) {
        return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
      }
      authUserId = authData.user.id;
    }

    // Create or update the usuarios table record
    const usuarioPayload = {
      id: authUserId,
      email: cleanEmail,
      nome: cleanNome,
      nome_negocio: cleanNomeNegocio,
      plano: 'pendente_premium' as const,
      ultimo_acesso: new Date().toISOString(),
    };

    const { data: existingRecord } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle();

    if (existingRecord) {
      await supabaseAdmin
        .from('usuarios')
        .update({ nome: cleanNome, nome_negocio: cleanNomeNegocio, plano: 'pendente_premium' })
        .eq('id', authUserId);
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('usuarios')
        .insert(usuarioPayload);

      if (insertError) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
      }
    }

    // Create pending payment record
    await supabaseAdmin
      .from('pagamentos')
      .insert({ usuario_id: authUserId, valor: 50, estado: 'pendente' });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
