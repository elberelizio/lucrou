const VISITOR_ID_KEY = 'lucrou_visitor_id';

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function getDispositivo(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth <= 768 ? 'mobile' : 'desktop';
}

function getScreenWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth;
}

export async function registarVisita(): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    await fetch('/api/analytics/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: visitorId,
        dispositivo: getDispositivo(),
        user_agent: navigator.userAgent.substring(0, 300),
        largura_ecra: getScreenWidth(),
        referrer: document.referrer?.substring(0, 500) || null,
      }),
    });
  } catch {
    // Analytics não deve quebrar a app
  }
}

export async function registarEvento(payload: {
  tipo: 'page_view' | 'click' | 'feature' | 'session_end';
  pagina?: string;
  acao?: string;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: visitorId,
        ...payload,
      }),
      keepalive: true,
    });
  } catch {
    // silencioso
  }
}

export async function registarCalculoAnonimo(dados: {
  nome_produto: string;
  unidades: number;
  preco_compra: number;
  custo_transporte: number;
  outros_custos: number;
  lucro_percent: number;
  preco_recomendado: number;
  lucro_por_unidade: number;
  lucro_total: number;
  modo: 'modoA' | 'modoB';
}): Promise<string | null> {
  try {
    const visitorId = getOrCreateVisitorId();
    await registarEvento({
      tipo: 'feature',
      pagina: '/resultado',
      acao: 'calculo_feito',
      detalhes: {
        modo: dados.modo,
        lucro_total: dados.lucro_total,
        nome_produto: dados.nome_produto?.substring(0, 80),
      },
    });

    const response = await fetch('/api/analytics/calculo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dados, visitor_id: visitorId }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.calculo_id || null;
  } catch {
    return null;
  }
}
