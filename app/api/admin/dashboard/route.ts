import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/security';

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: '—', os: '—' };
  let browser = 'Outro';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Outro';
  if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';

  return { browser, os };
}

function duracaoSegundos(inicio: string, fim: string): number {
  const ms = new Date(fim).getTime() - new Date(inicio).getTime();
  return Math.max(0, Math.round(ms / 1000));
}

function isMissingTable(error: { message?: string } | null): boolean {
  const msg = error?.message ?? '';
  return msg.includes('Could not find the table');
}

function isMissingColumn(error: { message?: string } | null): boolean {
  const msg = error?.message ?? '';
  return msg.includes('does not exist') || msg.includes('column');
}

type CalculoRow = {
  id: string;
  visitor_id?: string | null;
  usuario_id?: string | null;
  nome_produto: string;
  unidades: number;
  preco_recomendado: number;
  lucro_total: number;
  modo: string;
  guardado?: boolean;
  stock_atual?: number;
  criado_em: string;
};

async function loadCalculos() {
  const fullSelect =
    'id, visitor_id, usuario_id, nome_produto, unidades, preco_recomendado, lucro_total, modo, guardado, stock_atual, criado_em';
  const basicSelect =
    'id, usuario_id, nome_produto, unidades, preco_recomendado, lucro_total, modo, criado_em';

  const full = await supabaseAdmin
    .from('calculos')
    .select(fullSelect)
    .order('criado_em', { ascending: false })
    .limit(300);

  if (!full.error) {
    return { data: (full.data ?? []) as CalculoRow[], analyticsColumns: true };
  }
  if (!isMissingColumn(full.error)) {
    return { error: full.error };
  }

  const basic = await supabaseAdmin
    .from('calculos')
    .select(basicSelect)
    .order('criado_em', { ascending: false })
    .limit(300);

  if (basic.error) {
    return { error: basic.error };
  }

  const data = (basic.data ?? []).map((row) => ({
    ...row,
    visitor_id: null,
    guardado: !!row.usuario_id,
    stock_atual: 0,
  })) as CalculoRow[];

  return { data, analyticsColumns: false };
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const [
      { data: sessoes, error: errSessoes },
      { data: eventos, error: errEventos },
      calculosResult,
      { data: users, error: errUsers },
      { data: sugestoes, error: errSugestoes },
      { data: avaliacoes, error: errAvaliacoes },
      { data: movimentos, error: errMovimentos },
    ] = await Promise.all([
      supabaseAdmin
        .from('sessoes')
        .select('*')
        .order('ultimo_acesso', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('eventos_analytics')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(2000),
      loadCalculos(),
      supabaseAdmin
        .from('usuarios')
        .select('id, email, criado_em, ultimo_acesso, plano')
        .order('criado_em', { ascending: false }),
      supabaseAdmin
        .from('sugestoes')
        .select('id, visitor_id, texto, ip_address, criado_em')
        .order('criado_em', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('avaliacoes')
        .select('id, visitor_id, usuario_id, estrelas, ip_address, criado_em')
        .order('criado_em', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('movimentos_stock')
        .select('id, usuario_id, tipo, quantidade, criado_em')
        .order('criado_em', { ascending: false })
        .limit(500),
    ]);

    if (errSessoes && !isMissingTable(errSessoes)) {
      return NextResponse.json({ error: 'Could not load sessions', details: errSessoes.message }, { status: 500 });
    }
    if ('error' in calculosResult && calculosResult.error) {
      return NextResponse.json(
        { error: 'Could not load calculations', details: calculosResult.error.message },
        { status: 500 }
      );
    }

    const sessoesList = errSessoes ? [] : (sessoes ?? []);
    const eventosList = errEventos ? [] : (eventos ?? []);
    const calculosList = calculosResult.data ?? [];
    const sugestoesList = errSugestoes && !isMissingTable(errSugestoes) ? [] : (sugestoes ?? []);
    const avaliacoesList = errAvaliacoes && !isMissingTable(errAvaliacoes) ? [] : (avaliacoes ?? []);
    const movimentosList = errMovimentos && !isMissingTable(errMovimentos) ? [] : (movimentos ?? []);
    const sessoesOk = !errSessoes;
    const eventosOk = !errEventos;
    const sql_pendente =
      !sessoesOk || !eventosOk || !calculosResult.analyticsColumns;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const visitantesHoje = sessoesList.filter(
      (s) => new Date(s.primeiro_acesso) >= hoje
    ).length;

    const mobile = sessoesList.filter((s) => s.dispositivo === 'mobile').length;
    const desktop = sessoesList.length - mobile;

    const duracoes = sessoesList.map((s) =>
      duracaoSegundos(s.primeiro_acesso, s.ultimo_acesso)
    );
    const tempoMedioSeg =
      duracoes.length > 0
        ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
        : 0;

    // Páginas mais visitadas + tempo médio
    const pageCounts = new Map<string, { views: number; tempo: number; timeSamples: number }>();

    const addPageTime = (path: string, duracao_seg: number, countView = false) => {
      const prev = pageCounts.get(path) || { views: 0, tempo: 0, timeSamples: 0 };
      if (countView) prev.views += 1;
      if (duracao_seg > 0) {
        prev.tempo += duracao_seg;
        prev.timeSamples += 1;
      }
      pageCounts.set(path, prev);
    };

    for (const ev of eventosList) {
      const path = ev.pagina;
      if (!path) continue;

      if (ev.tipo === 'page_view') {
        const dur = typeof ev.detalhes?.duracao_seg === 'number' ? ev.detalhes.duracao_seg : 0;
        if (ev.acao === 'saida' || ev.acao === 'tempo') {
          addPageTime(path, dur, false);
        } else {
          addPageTime(path, dur, true);
        }
      }

      if (ev.tipo === 'session_end') {
        const dur = typeof ev.detalhes?.duracao_seg === 'number' ? ev.detalhes.duracao_seg : 0;
        addPageTime(path, dur, dur > 0);
      }
    }

    // Fallback: páginas onde houve cliques (se ainda não há page_view)
    if (pageCounts.size === 0) {
      for (const ev of eventosList.filter((e) => e.tipo === 'click' && e.pagina)) {
        addPageTime(ev.pagina!, 0, true);
      }
    }

    const paginas_mais_visitadas = [...pageCounts.entries()]
      .map(([path, v]) => ({
        path,
        views: v.views,
        tempo_medio_seg:
          v.timeSamples > 0 ? Math.round(v.tempo / v.timeSamples) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    // Cliques mais comuns
    const clickCounts = new Map<string, number>();
    for (const ev of eventosList.filter((e) => e.tipo === 'click')) {
      const key = `${ev.pagina || '?'} → ${ev.acao || 'clique'}`;
      clickCounts.set(key, (clickCounts.get(key) || 0) + 1);
    }
    const cliques_mais_comuns = [...clickCounts.entries()]
      .map(([label, count]) => {
        const [pagina, acao] = label.split(' → ');
        return { pagina, acao, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Funcionalidades (features)
    const featCounts = new Map<string, number>();
    for (const ev of eventosList.filter((e) => e.tipo === 'feature')) {
      const nome = ev.acao || 'desconhecido';
      featCounts.set(nome, (featCounts.get(nome) || 0) + 1);
    }
    const funcionalidades = [...featCounts.entries()]
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);

    // Eventos por dia (últimos 7 dias)
    const porDia = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      porDia.set(d.toISOString().slice(0, 10), 0);
    }
    for (const ev of eventosList) {
      const dia = ev.criado_em?.slice(0, 10);
      if (dia && porDia.has(dia)) {
        porDia.set(dia, (porDia.get(dia) || 0) + 1);
      }
    }
    const eventos_por_dia = [...porDia.entries()].map(([dia, total]) => ({ dia, total }));

    // Testadores (sessões anónimas enriquecidas)
    const eventosPorVisitor = new Map<string, typeof eventosList>();
    for (const ev of eventosList) {
      const list = eventosPorVisitor.get(ev.visitor_id) || [];
      list.push(ev);
      eventosPorVisitor.set(ev.visitor_id, list);
    }

    const calculosPorVisitor = new Map<string, typeof calculosList>();
    for (const c of calculosList) {
      if (!c.visitor_id) continue;
      const list = calculosPorVisitor.get(c.visitor_id) || [];
      list.push(c);
      calculosPorVisitor.set(c.visitor_id, list);
    }

    // Se não há tabela sessoes, agrupar testadores pelos cálculos
    const testadoresFromCalculos = () => {
      const byVisitor = new Map<string, typeof calculosList>();
      for (const c of calculosList) {
        if (!c.visitor_id) continue;
        const list = byVisitor.get(c.visitor_id) || [];
        list.push(c);
        byVisitor.set(c.visitor_id, list);
      }
      return [...byVisitor.entries()].map(([visitor_id, cals]) => ({
        visitor_id,
        ip_address: '—',
        pais: '—',
        dispositivo: '—',
        browser: '—',
        os: '—',
        largura_ecra: null,
        user_agent: '—',
        primeiro_acesso: cals[cals.length - 1]?.criado_em ?? new Date().toISOString(),
        ultimo_acesso: cals[0]?.criado_em ?? new Date().toISOString(),
        duracao_seg: 0,
        total_calculos: cals.length,
        total_cliques: 0,
        paginas_visitadas: [] as string[],
        calculos: cals.slice(0, 10).map((c) => ({
          id: c.id,
          nome_produto: c.nome_produto,
          stock_atual: c.stock_atual ?? 0,
          lucro_total: c.lucro_total,
          modo: c.modo,
          criado_em: c.criado_em,
        })),
        ultimos_eventos: [],
      }));
    };

    const testadores = sessoesList.length > 0
      ? sessoesList.map((s) => {
      const evs = eventosPorVisitor.get(s.visitor_id) || [];
      const cals = calculosPorVisitor.get(s.visitor_id) || [];
      const { browser, os } = parseUserAgent(s.user_agent);
      const paginasSet = new Set(
        evs.filter((e) => e.tipo === 'page_view' && e.pagina).map((e) => e.pagina as string)
      );

      return {
        visitor_id: s.visitor_id,
        ip_address: s.ip_address || evs.find((e) => e.ip_address)?.ip_address || '—',
        pais: s.pais || '—',
        dispositivo: s.dispositivo || '—',
        browser,
        os,
        largura_ecra: s.largura_ecra,
        user_agent: s.user_agent?.substring(0, 120) || '—',
        primeiro_acesso: s.primeiro_acesso,
        ultimo_acesso: s.ultimo_acesso,
        duracao_seg: duracaoSegundos(s.primeiro_acesso, s.ultimo_acesso),
        total_calculos: s.total_calculos ?? cals.length,
        total_cliques: evs.filter((e) => e.tipo === 'click').length,
        paginas_visitadas: [...paginasSet],
        calculos: cals.slice(0, 10).map((c) => ({
          id: c.id,
          nome_produto: c.nome_produto,
          stock_atual: c.stock_atual ?? 0,
          lucro_total: c.lucro_total,
          modo: c.modo,
          criado_em: c.criado_em,
        })),
        ultimos_eventos: evs.slice(0, 8).map((e) => ({
          tipo: e.tipo,
          pagina: e.pagina,
          acao: e.acao,
          criado_em: e.criado_em,
        })),
      };
    })
      : testadoresFromCalculos();

    const calculos_recentes = calculosList.slice(0, 50).map((c) => ({
      id: c.id,
      visitor_id: c.visitor_id,
      tem_email: !!c.usuario_id,
      nome_produto: c.nome_produto,
      stock_atual: c.stock_atual ?? 0,
      unidades: c.unidades,
      preco_recomendado: c.preco_recomendado,
      lucro_total: c.lucro_total,
      modo: c.modo,
      guardado: c.guardado,
      criado_em: c.criado_em,
    }));

    const ipsUnicos = new Set(sessoesList.map((s) => s.ip_address).filter(Boolean));

    const calculosPorUsuario = calculosList.reduce<Record<string, number>>((acc, c) => {
      if (c.usuario_id) acc[c.usuario_id] = (acc[c.usuario_id] || 0) + 1;
      return acc;
    }, {});

    const movimentosPorUsuario = movimentosList.reduce<Record<string, number>>((acc, m) => {
      if (m.usuario_id) acc[m.usuario_id] = (acc[m.usuario_id] || 0) + 1;
      return acc;
    }, {});

    const stockPorUsuario = calculosList.reduce<Record<string, number>>((acc, c) => {
      if (c.usuario_id && (c.stock_atual ?? 0) > 0) {
        acc[c.usuario_id] = (acc[c.usuario_id] || 0) + 1;
      }
      return acc;
    }, {});

    const mediaAvaliacao =
      avaliacoesList.length > 0
        ? Math.round(
            (avaliacoesList.reduce((s, a) => s + a.estrelas, 0) / avaliacoesList.length) * 10
          ) / 10
        : 0;

    const contasHoje = (users ?? []).filter(
      (u) => new Date(u.criado_em) >= hoje
    ).length;

    return NextResponse.json({
      tracking_disponivel: sessoesOk && eventosOk,
      sql_pendente,
      aviso_privacidade:
        'Número de telefone real não é acessível sem o utilizador o digitar. IP e dispositivo são aproximados.',
      resumo: {
        total_visitantes: sessoesList.length,
        visitantes_hoje: visitantesHoje,
        ips_unicos: ipsUnicos.size,
        total_eventos: eventosList.length,
        total_calculos: calculosList.length,
        tempo_medio_seg: tempoMedioSeg,
        utilizadores_email: users?.length ?? 0,
        total_avaliacoes: avaliacoesList.length,
        media_avaliacao: mediaAvaliacao,
        contas_hoje: contasHoje,
      },
      dispositivos: {
        mobile,
        desktop,
        percent_mobile: sessoesList.length > 0 ? Math.round((mobile / sessoesList.length) * 100) : 0,
      },
      funil: {
        entraram_app: sessoesList.length,
        fizeram_calculo: sessoesList.filter((s) => (s.total_calculos ?? 0) > 0).length,
        calcularam_sem_guardar: calculosList.filter((c) => !c.usuario_id && c.guardado === false).length,
        guardaram_produto: calculosList.filter((c) => c.guardado !== false).length,
        registaram_email: users?.length ?? 0,
      },
      paginas_mais_visitadas,
      cliques_mais_comuns,
      funcionalidades,
      eventos_por_dia,
      testadores,
      calculos_recentes,
      usuarios: (users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        criado_em: u.criado_em,
        ultimo_acesso: u.ultimo_acesso,
        plano: u.plano ?? 'gratuito',
        total_calculos: calculosPorUsuario[u.id] ?? 0,
        total_movimentos_stock: movimentosPorUsuario[u.id] ?? 0,
        produtos_com_stock: stockPorUsuario[u.id] ?? 0,
      })),
      sugestoes: sugestoesList.map((s) => ({
        id: s.id,
        visitor_id: s.visitor_id,
        texto: s.texto,
        ip_address: s.ip_address,
        criado_em: s.criado_em,
      })),
      avaliacoes: avaliacoesList.map((a) => ({
        id: a.id,
        visitor_id: a.visitor_id,
        usuario_id: a.usuario_id,
        estrelas: a.estrelas,
        ip_address: a.ip_address,
        criado_em: a.criado_em,
      })),
    });
  } catch (e) {
    console.error('[admin/dashboard]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
