import { NextRequest, NextResponse } from 'next/server';
import { findAuthUserByEmail, isAuthEmailExistsError } from '@/lib/auth-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { validatePasswordStrength } from '@/lib/security';
import { supabaseAdmin } from '@/lib/supabase';

const EMAIL_EXISTS_BODY = {
  code: 'EMAIL_EXISTS' as const,
  error:
    'Este email já tem conta no Lucrou. Entra com o teu email e senha — ou recupera a senha se a esqueceste.',
};

function emailExistsResponse() {
  return NextResponse.json(EMAIL_EXISTS_BODY, { status: 409 });
}

// POST /api/auth/register-free — conta gratuita com email + senha
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'auth-register-free', limit: 5, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[register-free] SUPABASE_SERVICE_ROLE_KEY em falta');
      return NextResponse.json({ error: 'Servidor não configurado' }, { status: 503 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: existingUsuario, error: lookupError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (lookupError) {
      console.error('[register-free] lookup usuarios:', lookupError.message);
      return NextResponse.json({ error: 'Não foi possível criar conta' }, { status: 500 });
    }

    if (existingUsuario) {
      return emailExistsResponse();
    }

    let authUserId: string;
    let createdAuthUser = false;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (!isAuthEmailExistsError(authError)) {
        console.error('[register-free] createUser:', authError.message);
        return NextResponse.json({ error: 'Não foi possível criar conta' }, { status: 500 });
      }

      let authUser = null;
      try {
        authUser = await findAuthUserByEmail(cleanEmail);
      } catch (findErr) {
        console.error('[register-free] findAuthUserByEmail:', findErr);
        return emailExistsResponse();
      }

      if (!authUser) {
        return emailExistsResponse();
      }

      authUserId = authUser.id;

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
      });

      if (updateError) {
        console.error('[register-free] updateUser:', updateError.message);
        return NextResponse.json({ error: 'Não foi possível criar conta' }, { status: 500 });
      }
    } else {
      if (!authData.user?.id) {
        return NextResponse.json({ error: 'Não foi possível criar conta' }, { status: 500 });
      }
      authUserId = authData.user.id;
      createdAuthUser = true;
    }

    const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
      id: authUserId,
      email: cleanEmail,
      plano: 'gratuito',
      ultimo_acesso: new Date().toISOString(),
    });

    if (insertError) {
      console.error('[register-free] insert usuarios:', insertError.message, insertError.code);
      if (insertError.code === '23505') {
        return emailExistsResponse();
      }
      if (createdAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {});
      }
      return NextResponse.json({ error: 'Não foi possível criar conta' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[register-free]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
