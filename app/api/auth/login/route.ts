import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, anon);
}

// POST /api/auth/login — login com rate limit no servidor
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, {
    key: 'auth-login',
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Senha inválida' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!usuario) {
      return NextResponse.json(
        {
          code: 'EMAIL_NOT_FOUND',
          error: 'Não encontrámos conta com este email. Verifica o endereço ou cria uma conta.',
        },
        { status: 404 }
      );
    }

    const supabase = getPublicSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          code: 'INVALID_CREDENTIALS',
          error: 'Email ou senha incorrectos.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
