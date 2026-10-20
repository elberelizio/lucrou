import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthUserForEmail } from '@/lib/auth-admin';
import { hasCustomOtpEmailProvider, sendRecoveryOtpEmail } from '@/lib/otp-email';
import { checkRateLimit } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, anon);
}

// POST /api/auth/esqueci-senha — envia código OTP numérico por email
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'auth-esqueci', limit: 3, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Servidor não configurado' }, { status: 503 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
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
          error: 'Não encontrámos conta com este email. Verifica o endereço ou cria uma conta nova.',
        },
        { status: 404 }
      );
    }

    const authUser = await resolveAuthUserForEmail(cleanEmail);
    if (!authUser) {
      return NextResponse.json(
        {
          code: 'AUTH_MISSING',
          error:
            'Encontrámos o teu email mas a conta precisa de ser activada. Cria conta novamente com o mesmo email ou contacta-nos.',
        },
        { status: 400 }
      );
    }

    // Envio directo do código via Resend (não depende do template Supabase)
    if (hasCustomOtpEmailProvider()) {
      const { data: linkData, error: genError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
      });

      const otp = linkData?.properties?.email_otp;
      if (genError || !otp) {
        console.error('[esqueci-senha] generateLink:', genError?.message);
        return NextResponse.json(
          { error: 'Não foi possível gerar o código. Tenta novamente.' },
          { status: 500 }
        );
      }

      const sent = await sendRecoveryOtpEmail(cleanEmail, otp);
      if (!sent.ok) {
        return NextResponse.json({ error: sent.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, method: 'otp' });
    }

    // Supabase envia o email — o template "Reset password" deve usar {{ .Token }}, não link
    const supabase = getPublicSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

    if (error) {
      console.error('[esqueci-senha] resetPasswordForEmail:', error.message, error.code);

      if (error.code === 'email_address_invalid') {
        return NextResponse.json({ error: 'Email inválido. Verifica o endereço.' }, { status: 400 });
      }

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar o código. Confirma que o email está correcto e tenta outra vez.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, method: 'otp' });
  } catch (err) {
    console.error('[esqueci-senha]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
