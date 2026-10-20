import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

// POST /api/auth/verificar-conta — verifica se email tem conta antes do login
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'auth-verificar', limit: 10, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
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
          error: 'Não encontrámos conta com este email. Cria uma conta ou verifica o endereço.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ exists: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
