import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { translate } from '@/lib/i18n/messages';
import type { Locale } from '@/lib/i18n/types';

type Period = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

function getDateRange(
  period: Period,
  locale: Locale
): { start: string; end: string; label: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let label: string;
  const locTag = locale === 'pt' ? 'pt-MZ' : 'en-US';

  if (period === 'semanal') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    endDate = now;
    label = translate(locale, 'resumoApi.ultimos7');
    return { start: startDate.toISOString(), end: endDate.toISOString(), label };
  }

  if (period === 'mensal') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthLabel = now.toLocaleDateString(locTag, { month: 'long', year: 'numeric' });
    label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    return { start: startDate.toISOString(), end: endDate.toISOString(), label };
  }

  if (period === 'trimestral') {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 3);
    endDate = now;
    label = translate(locale, 'resumoApi.ultimos3m');
    return { start: startDate.toISOString(), end: endDate.toISOString(), label };
  }

  if (period === 'semestral') {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 6);
    endDate = now;
    label = translate(locale, 'resumoApi.ultimos6m');
    return { start: startDate.toISOString(), end: endDate.toISOString(), label };
  }

  startDate = new Date(now.getFullYear(), 0, 1);
  endDate = now;
  label = translate(locale, 'resumoApi.ano', { y: now.getFullYear() });
  return { start: startDate.toISOString(), end: endDate.toISOString(), label };
}

// GET /api/resumo-mensal?period=...&locale=en|pt
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawLocale = url.searchParams.get('locale');
    const locale: Locale = rawLocale === 'en' ? 'en' : 'pt';

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: translate(locale, 'api.naoAutenticado') }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: translate(locale, 'api.sessaoInvalida') }, { status: 401 });
    }

    const { data: userRecord } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .or(`id.eq.${user.id},email.eq.${user.email ?? ''}`)
      .maybeSingle();

    if (!userRecord) {
      return NextResponse.json({ error: translate(locale, 'api.userNaoEncontrado') }, { status: 404 });
    }

    const rawPeriod = url.searchParams.get('period') ?? 'mensal';
    const period: Period = ['semanal', 'mensal', 'trimestral', 'semestral', 'anual'].includes(rawPeriod)
      ? (rawPeriod as Period)
      : 'mensal';

    const { start, end, label } = getDateRange(period, locale);

    const { data: calculos, error } = await supabaseAdmin
      .from('calculos')
      .select('nome_produto, lucro_total, lucro_por_unidade, lucro_percent')
      .eq('usuario_id', userRecord.id)
      .gte('criado_em', start)
      .lte('criado_em', end);

    if (error) {
      return NextResponse.json({ error: translate(locale, 'api.erroCarregar') }, { status: 500 });
    }

    const list = calculos ?? [];
    const totalCalculos = list.length;
    const lucroTotalEstimado = list.reduce((sum, c) => sum + (Number(c.lucro_total) || 0), 0);

    const maisLucrativo = list.length > 0
      ? list.reduce((max, c) =>
          (Number(c.lucro_por_unidade) || 0) > (Number(max.lucro_por_unidade) || 0) ? c : max
        )
      : null;

    const withPositiveMargin = list.filter(c => (Number(c.lucro_percent) || 0) > 0);
    const menorMargem = withPositiveMargin.length > 0
      ? withPositiveMargin.reduce((min, c) =>
          (Number(c.lucro_percent) || 0) < (Number(min.lucro_percent) || 0) ? c : min
        )
      : null;

    return NextResponse.json({
      resumo: {
        period,
        label,
        total_calculos: totalCalculos,
        lucro_total_estimado: lucroTotalEstimado,
        produto_mais_lucrativo: maisLucrativo
          ? { nome: maisLucrativo.nome_produto, lucro_por_unidade: Number(maisLucrativo.lucro_por_unidade) }
          : null,
        produto_menor_margem: menorMargem
          ? { nome: menorMargem.nome_produto, lucro_percent: Number(menorMargem.lucro_percent) }
          : null,
      },
    });
  } catch {
    return NextResponse.json({ error: translate('en', 'api.erroInterno') }, { status: 500 });
  }
}

