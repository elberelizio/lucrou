import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { validatePasswordStrength } from '@/lib/security';
import { supabaseAdmin } from '@/lib/supabase';

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, anon);
}

// POST /api/auth/redefinir-senha — valida código OTP (uso único) e define nova senha
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'auth-redefinir', limit: 5, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { email, codigo, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!codigo || typeof codigo !== 'string' || codigo.trim().length < 6) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const token = codigo.trim();

    const supabase = getPublicSupabase();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token,
      type: 'recovery',
    });

    if (verifyError || !data.user?.id) {
      return NextResponse.json(
        {
          code: 'INVALID_CODE',
          error: 'Código inválido ou expirado. Pede um novo código.',
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      password,
    });

    if (updateError) {
      console.error('[redefinir-senha]', updateError.message);
      return NextResponse.json({ error: 'Não foi possível actualizar a senha' }, { status: 500 });
    }

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[redefinir-senha]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
