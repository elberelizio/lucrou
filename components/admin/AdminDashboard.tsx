'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminSection, DashboardData } from '@/lib/admin-dashboard-types';

const NAV: { id: AdminSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: '◉' },
  { id: 'testadores', label: 'Testadores', icon: '◎' },
  { id: 'calculos', label: 'Cálculos', icon: '∑' },
  { id: 'paginas', label: 'Páginas & Cliques', icon: '⌗' },
  { id: 'dispositivos', label: 'Dispositivos', icon: '▣' },
  { id: 'usuarios', label: 'Contas', icon: '@' },
  { id: 'sugestoes', label: 'Sugestões', icon: '💡' },
  { id: 'avaliacoes', label: 'Avaliações', icon: '★' },
];

function fmtSeg(seg: number): string {
  if (seg < 60) return `${seg}s`;
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  if (m < 60) return `${m}m ${s}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtData(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-MZ', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BarChart({
  items,
  labelKey,
  valueKey,
  maxItems = 10,
}: {
  items: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  maxItems?: number;
}) {
  const slice = items.slice(0, maxItems);
  const max = Math.max(...slice.map((i) => Number(i[valueKey]) || 0), 1);

  return (
    <div className="space-y-2">
      {slice.map((item, i) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.round((val / max) * 100);
        return (
          <div key={i} className="group">
            <div className="flex justify-between text-xs mb-1 text-texto-med">
              <span className="truncate max-w-[70%]" title={String(item[labelKey])}>
                {String(item[labelKey])}
              </span>
              <span className="text-verde font-mono font-semibold">{val}</span>
            </div>
            <div className="h-2 bg-creme-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-verde rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: '#1B5E3B' }}
              />
            </div>
          </div>
        );
      })}
      {slice.length === 0 && (
        <p className="text-sm text-texto-med py-4 text-center">Sem dados ainda</p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-mint border border-creme-2 rounded-xl p-4">
      <p className="text-xs text-texto-med uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-verde font-mono">{value}</p>
      {sub && <p className="text-xs text-texto-med mt-1">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-creme-2 rounded-2xl shadow-card p-5">
      <h3 className="text-sm font-semibold text-texto-med uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminDashboard({
  senha,
  onLogout,
}: {
  senha: string;
  onLogout: () => void;
}) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [testadorSel, setTestadorSel] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'x-admin-password': senha },
      });
      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        setErro('Erro ao carregar dados');
        return;
      }
      const json = await res.json();
      setData(json);
      setErro('');
    } catch {
      setErro('Falha de ligação');
    } finally {
      setLoading(false);
    }
  }, [senha, onLogout]);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 20000);
    return () => clearInterval(t);
  }, [carregar]);

  const testadorDetalhe = data?.testadores.find((t) => t.visitor_id === testadorSel);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-creme-2 flex flex-col shadow-sm">
        <div className="p-5 border-b border-creme-2">
          <h1 className="text-lg font-bold text-verde font-serif tracking-tight">Lucrou</h1>
          <p className="text-xs text-texto-med mt-0.5">Painel de Testes</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setTestadorSel(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                section === item.id
                  ? 'bg-mint text-verde border border-verde-cl font-semibold'
                  : 'text-texto-med hover:bg-creme hover:text-texto'
              }`}
            >
              <span className="w-5 text-center opacity-70">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-creme-2 space-y-2">
          <button
            type="button"
            onClick={carregar}
            disabled={loading}
            className="w-full text-xs py-2 rounded-xl bg-creme text-texto-med hover:text-verde border border-creme-2 disabled:opacity-50"
          >
            {loading ? 'A actualizar…' : 'Actualizar agora'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-xs py-2 text-texto-med hover:text-laranja"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-creme">
        <header className="sticky top-0 z-10 bg-creme/95 backdrop-blur border-b border-creme-2 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-texto font-serif">
              {NAV.find((n) => n.id === section)?.label}
            </h2>
            <p className="text-xs text-texto-med mt-0.5">
              Dados em tempo real · actualização a cada 20s
            </p>
          </div>
          {data && (data.sql_pendente || !data.tracking_disponivel) && (
            <span className="text-xs bg-laranja-cl text-laranja px-3 py-1.5 rounded-xl border border-laranja/30">
              Execute supabase_analytics.sql + supabase_analytics_v2.sql no Supabase
            </span>
          )}
        </header>

        <div className="p-8">
          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {erro}
            </div>
          )}

          {!data && loading && (
            <p className="text-texto-med text-center py-20">A carregar analytics…</p>
          )}

          {data && section === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 bg-laranja-cl border border-laranja/30 rounded-2xl text-sm text-texto">
                <strong>O que consegues ver sem email:</strong> ID anónimo do browser, IP (aproximado),
                país, dispositivo, páginas visitadas, cliques, cálculos feitos e tempo na app.{' '}
                <strong>Não é possível</strong> ver o número de telefone real sem o utilizador o introduzir.
                {data.aviso_privacidade}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Testadores" value={data.resumo.total_visitantes} sub="sessões únicas" />
                <StatCard label="Hoje" value={data.resumo.visitantes_hoje} />
                <StatCard label="IPs únicos" value={data.resumo.ips_unicos} />
                <StatCard label="Tempo médio" value={fmtSeg(data.resumo.tempo_medio_seg)} sub="por sessão" />
                <StatCard label="Eventos" value={data.resumo.total_eventos} sub="cliques + páginas" />
                <StatCard label="Cálculos" value={data.resumo.total_calculos} />
                <StatCard label="Mobile" value={`${data.dispositivos.percent_mobile}%`} />
                <StatCard label="Com email" value={data.resumo.utilizadores_email} />
                <StatCard label="Contas hoje" value={data.resumo.contas_hoje} />
                <StatCard label="Avaliações" value={data.resumo.total_avaliacoes} sub={`média ${data.resumo.media_avaliacao}★`} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Panel title="Actividade últimos 7 dias">
                  <BarChart
                    items={data.eventos_por_dia.map((d) => ({
                      label: d.dia.slice(5),
                      value: d.total,
                    }))}
                    labelKey="label"
                    valueKey="value"
                  />
                </Panel>
                <Panel title="Funil de teste">
                  <div className="space-y-3">
                    {[
                      ['Entraram na app', data.funil.entraram_app],
                      ['Fizeram cálculo', data.funil.fizeram_calculo],
                      ['Calc. sem guardar', data.funil.calcularam_sem_guardar],
                      ['Guardaram produto', data.funil.guardaram_produto],
                      ['Registaram email', data.funil.registaram_email],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="flex justify-between text-sm">
                        <span className="text-texto-med">{label}</span>
                        <span className="font-mono text-verde font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Panel title="Funcionalidades mais usadas">
                  <BarChart
                    items={data.funcionalidades.map((f) => ({
                      label: f.nome,
                      value: f.count,
                    }))}
                    labelKey="label"
                    valueKey="value"
                  />
                </Panel>
                <Panel title="Páginas mais visitadas">
                  <BarChart
                    items={data.paginas_mais_visitadas.map((p) => ({
                      label: p.path,
                      value: p.views,
                    }))}
                    labelKey="label"
                    valueKey="value"
                  />
                </Panel>
              </div>
            </div>
          )}

          {data && section === 'testadores' && (
            <div className="flex gap-6">
              <div className="flex-1">
                <Panel title={`Testadores (${data.testadores.length})`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-texto-med border-b border-creme-2">
                          <th className="pb-2 pr-4">ID</th>
                          <th className="pb-2 pr-4">IP</th>
                          <th className="pb-2 pr-4">País</th>
                          <th className="pb-2 pr-4">Disp.</th>
                          <th className="pb-2 pr-4">OS</th>
                          <th className="pb-2 pr-4 whitespace-nowrap">Primeiro acesso</th>
                          <th className="pb-2 pr-4 whitespace-nowrap">Último acesso</th>
                          <th className="pb-2 pr-4">Tempo</th>
                          <th className="pb-2 pr-4">Calc.</th>
                          <th className="pb-2">Cliques</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.testadores.map((t) => (
                          <tr
                            key={t.visitor_id}
                            onClick={() => setTestadorSel(t.visitor_id)}
                            className={`border-b border-creme-2/50 cursor-pointer hover:bg-mint ${
                              testadorSel === t.visitor_id ? 'bg-mint' : ''
                            }`}
                          >
                            <td className="py-2.5 pr-4 font-mono text-xs text-verde">
                              {t.visitor_id.slice(0, 8)}…
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-xs">{t.ip_address || '—'}</td>
                            <td className="py-2.5 pr-4">{t.pais || '—'}</td>
                            <td className="py-2.5 pr-4 capitalize">{t.dispositivo}</td>
                            <td className="py-2.5 pr-4">{t.os || '—'}</td>
                            <td className="py-2.5 pr-4 text-xs whitespace-nowrap" title={t.primeiro_acesso}>
                              {fmtData(t.primeiro_acesso)}
                            </td>
                            <td className="py-2.5 pr-4 text-xs whitespace-nowrap font-medium" title={t.ultimo_acesso}>
                              {fmtData(t.ultimo_acesso)}
                            </td>
                            <td className="py-2.5 pr-4">{fmtSeg(t.duracao_seg)}</td>
                            <td className="py-2.5 pr-4">{t.total_calculos}</td>
                            <td className="py-2.5">{t.total_cliques}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.testadores.length === 0 && (
                      <p className="text-center text-texto-med py-8">Nenhum testador ainda</p>
                    )}
                  </div>
                </Panel>
              </div>

              {testadorDetalhe && (
                <div className="w-96 shrink-0 space-y-4">
                  <Panel title="Perfil do testador">
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-texto-med text-xs">Visitor ID</dt>
                        <dd className="font-mono text-xs break-all text-verde">
                          {testadorDetalhe.visitor_id}
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <dt className="text-texto-med text-xs">IP</dt>
                          <dd className="font-mono">{testadorDetalhe.ip_address}</dd>
                        </div>
                        <div>
                          <dt className="text-texto-med text-xs">País</dt>
                          <dd>{testadorDetalhe.pais}</dd>
                        </div>
                        <div>
                          <dt className="text-texto-med text-xs">Dispositivo</dt>
                          <dd className="capitalize">{testadorDetalhe.dispositivo}</dd>
                        </div>
                        <div>
                          <dt className="text-texto-med text-xs">Ecrã</dt>
                          <dd>{testadorDetalhe.largura_ecra ? `${testadorDetalhe.largura_ecra}px` : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-texto-med text-xs">Browser</dt>
                          <dd>{testadorDetalhe.browser}</dd>
                        </div>
                        <div>
                          <dt className="text-texto-med text-xs">Sistema</dt>
                          <dd>{testadorDetalhe.os}</dd>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="rounded-xl bg-mint px-3 py-2">
                          <dt className="text-texto-med text-xs">Primeiro acesso</dt>
                          <dd className="font-medium text-sm mt-0.5">{fmtData(testadorDetalhe.primeiro_acesso)}</dd>
                        </div>
                        <div className="rounded-xl bg-mint px-3 py-2">
                          <dt className="text-texto-med text-xs">Último acesso</dt>
                          <dd className="font-medium text-sm mt-0.5">{fmtData(testadorDetalhe.ultimo_acesso)}</dd>
                        </div>
                      </div>
                      <div>
                        <dt className="text-texto-med text-xs">User-Agent</dt>
                        <dd className="text-xs text-texto-med break-all">{testadorDetalhe.user_agent}</dd>
                      </div>
                    </dl>
                  </Panel>

                  <Panel title="Páginas visitadas">
                    <div className="flex flex-wrap gap-1">
                      {testadorDetalhe.paginas_visitadas.map((p) => (
                        <span
                          key={p}
                          className="text-xs bg-mint px-2 py-1 rounded-lg text-verde border border-verde-cl"
                        >
                          {p}
                        </span>
                      ))}
                      {testadorDetalhe.paginas_visitadas.length === 0 && (
                        <span className="text-xs text-texto-med">—</span>
                      )}
                    </div>
                  </Panel>

                  <Panel title="Cálculos deste testador">
                    {testadorDetalhe.calculos.map((c) => (
                      <div key={c.id} className="text-xs border-b border-creme-2/50 py-2 last:border-0">
                        <p className="text-texto font-medium">{c.nome_produto || 'Sem nome'}</p>
                        <p className="text-texto-med">
                          Stock {c.stock_atual ?? 0} · Lucro {c.lucro_total} MT · {c.modo} ·{' '}
                          {fmtData(c.criado_em)}
                        </p>
                      </div>
                    ))}
                    {testadorDetalhe.calculos.length === 0 && (
                      <p className="text-xs text-texto-med">Nenhum cálculo</p>
                    )}
                  </Panel>

                  <Panel title="Últimos eventos">
                    {testadorDetalhe.ultimos_eventos.map((e, i) => (
                      <div key={i} className="text-xs py-1.5 border-b border-creme-2/30 last:border-0">
                        <span className="text-verde">{e.tipo}</span>
                        <span className="text-texto-med"> · {e.pagina}</span>
                        {e.acao && <span className="text-texto"> → {e.acao}</span>}
                        <p className="text-texto-med">{fmtData(e.criado_em)}</p>
                      </div>
                    ))}
                  </Panel>
                </div>
              )}
            </div>
          )}

          {data && section === 'calculos' && (
            <Panel title="Todos os cálculos (com e sem email)">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-texto-med border-b border-creme-2">
                    <th className="pb-2 pr-3">Nome</th>
                    <th className="pb-2 pr-3">Stock</th>
                    <th className="pb-2 pr-3">Unid.</th>
                    <th className="pb-2 pr-3">Preço rec.</th>
                    <th className="pb-2 pr-3">Lucro</th>
                    <th className="pb-2 pr-3">Modo</th>
                    <th className="pb-2 pr-3">Email?</th>
                    <th className="pb-2 pr-3">Visitor</th>
                    <th className="pb-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.calculos_recentes.map((c) => (
                    <tr key={c.id} className="border-b border-creme-2/40 hover:bg-mint">
                      <td className="py-2 pr-3">{c.nome_produto || '—'}</td>
                      <td className="py-2 pr-3 font-mono">{c.stock_atual ?? 0}</td>
                      <td className="py-2 pr-3">{c.unidades}</td>
                      <td className="py-2 pr-3 font-mono">{c.preco_recomendado}</td>
                      <td className="py-2 pr-3 font-mono text-verde">{c.lucro_total}</td>
                      <td className="py-2 pr-3">{c.modo}</td>
                      <td className="py-2 pr-3">{c.tem_email ? '✓' : '—'}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-texto-med">
                        {c.visitor_id?.slice(0, 8) ?? '—'}
                      </td>
                      <td className="py-2 text-xs text-texto-med">{fmtData(c.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}

          {data && section === 'paginas' && (
            <div className="grid grid-cols-2 gap-6">
              <Panel title="Páginas + tempo médio">
                {data.paginas_mais_visitadas.length === 0 ? (
                  <p className="text-sm text-texto-med py-6 text-center leading-relaxed">
                    Ainda sem dados de páginas. Peça aos testadores que naveguem na app
                    (início → calcular → resultado). Os dados aparecem após mudarem de ecrã.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-texto-med text-left border-b border-creme-2">
                        <th className="pb-2">Página</th>
                        <th className="pb-2">Visitas / interacções</th>
                        <th className="pb-2">Tempo médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paginas_mais_visitadas.map((p) => (
                        <tr key={p.path} className="border-b border-creme-2/40">
                          <td className="py-2 font-mono text-verde">{p.path}</td>
                          <td className="py-2">{p.views}</td>
                          <td className="py-2">
                            {p.tempo_medio_seg > 0 ? fmtSeg(p.tempo_medio_seg) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
              <Panel title="Cliques mais frequentes">
                <BarChart
                  items={data.cliques_mais_comuns.map((c) => ({
                    label: `${c.pagina} → ${c.acao}`,
                    value: c.count,
                  }))}
                  labelKey="label"
                  valueKey="value"
                  maxItems={15}
                />
              </Panel>
            </div>
          )}

          {data && section === 'dispositivos' && (
            <div className="grid grid-cols-2 gap-6 max-w-3xl">
              <Panel title="Mobile vs Desktop">
                <div className="flex gap-8 items-center justify-center py-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-verde">{data.dispositivos.mobile}</p>
                    <p className="text-sm text-texto-med">Mobile ({data.dispositivos.percent_mobile}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-texto">{data.dispositivos.desktop}</p>
                    <p className="text-sm text-texto-med">Desktop</p>
                  </div>
                </div>
              </Panel>
              <Panel title="Por sistema operativo">
                <BarChart
                  items={Object.entries(
                    data.testadores.reduce<Record<string, number>>((acc, t) => {
                      acc[t.os] = (acc[t.os] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([label, value]) => ({ label, value }))}
                  labelKey="label"
                  valueKey="value"
                />
              </Panel>
              <Panel title="Por browser">
                <BarChart
                  items={Object.entries(
                    data.testadores.reduce<Record<string, number>>((acc, t) => {
                      acc[t.browser] = (acc[t.browser] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([label, value]) => ({ label, value }))}
                  labelKey="label"
                  valueKey="value"
                />
              </Panel>
            </div>
          )}

          {data && section === 'usuarios' && (
            <Panel title={`Contas registadas (${data.usuarios.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-texto-med text-left border-b border-creme-2">
                      <th className="pb-2 pr-3">Email</th>
                      <th className="pb-2 pr-3">Registo</th>
                      <th className="pb-2 pr-3">Último acesso</th>
                      <th className="pb-2 pr-3">Cálculos</th>
                      <th className="pb-2 pr-3">Stock</th>
                      <th className="pb-2">Plano</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.usuarios.map((u) => (
                      <tr key={u.id} className="border-b border-creme-2/40">
                        <td className="py-2 pr-3">{u.email}</td>
                        <td className="py-2 pr-3 text-texto-med">{fmtData(u.criado_em)}</td>
                        <td className="py-2 pr-3 text-texto-med">
                          {u.ultimo_acesso ? fmtData(u.ultimo_acesso) : '—'}
                        </td>
                        <td className="py-2 pr-3 font-mono text-verde">{u.total_calculos}</td>
                        <td className="py-2 pr-3 text-texto-med">
                          {u.total_movimentos_stock > 0
                            ? `${u.total_movimentos_stock} mov.`
                            : u.produtos_com_stock > 0
                              ? `${u.produtos_com_stock} prod.`
                              : '—'}
                        </td>
                        <td className="py-2 capitalize">{u.plano}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.usuarios.length === 0 && (
                <p className="text-center text-texto-med py-6">Ninguém criou conta ainda</p>
              )}
            </Panel>
          )}

          {data && section === 'sugestoes' && (
            <Panel title={`Sugestões dos utilizadores (${data.sugestoes.length})`}>
              <div className="space-y-4">
                {data.sugestoes.map((s) => (
                  <div
                    key={s.id}
                    className="border border-creme-2 rounded-xl p-4 bg-creme/50"
                  >
                    <p className="text-sm text-texto whitespace-pre-wrap leading-relaxed">
                      {s.texto}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-texto-med">
                      <span>{fmtData(s.criado_em)}</span>
                      {s.visitor_id && (
                        <span className="font-mono">ID: {s.visitor_id.slice(0, 8)}…</span>
                      )}
                      {s.ip_address && <span className="font-mono">IP: {s.ip_address}</span>}
                    </div>
                  </div>
                ))}
                {data.sugestoes.length === 0 && (
                  <p className="text-center text-texto-med py-8">
                    Nenhuma sugestão ainda. Execute supabase_sugestoes.sql no Supabase se a tabela não existir.
                  </p>
                )}
              </div>
            </Panel>
          )}

          {data && section === 'avaliacoes' && (
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total avaliações" value={data.resumo.total_avaliacoes} />
                <StatCard label="Média" value={`${data.resumo.media_avaliacao} ★`} />
              </div>
              <Panel title="Avaliações recentes">
                <div className="space-y-3">
                  {data.avaliacoes.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b border-creme-2/50 pb-2">
                      <div>
                        <span className="text-lg text-yellow-500">{'★'.repeat(a.estrelas)}{'☆'.repeat(5 - a.estrelas)}</span>
                        <p className="text-xs text-texto-med mt-1">{fmtData(a.criado_em)}</p>
                      </div>
                      <div className="text-xs text-texto-med text-right">
                        {a.usuario_id && <span className="block font-mono">conta</span>}
                        {a.visitor_id && <span className="font-mono">{a.visitor_id.slice(0, 8)}…</span>}
                      </div>
                    </div>
                  ))}
                  {data.avaliacoes.length === 0 && (
                    <p className="text-center text-texto-med py-6">
                      Nenhuma avaliação ainda. Execute supabase_avaliacoes.sql no Supabase.
                    </p>
                  )}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
