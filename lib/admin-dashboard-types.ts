export interface DashboardData {
  tracking_disponivel: boolean;
  sql_pendente?: boolean;
  aviso_privacidade: string;
  resumo: {
    total_visitantes: number;
    visitantes_hoje: number;
    ips_unicos: number;
    total_eventos: number;
    total_calculos: number;
    tempo_medio_seg: number;
    utilizadores_email: number;
    total_avaliacoes: number;
    media_avaliacao: number;
    contas_hoje: number;
  };
  dispositivos: { mobile: number; desktop: number; percent_mobile: number };
  funil: Record<string, number>;
  paginas_mais_visitadas: { path: string; views: number; tempo_medio_seg: number }[];
  cliques_mais_comuns: { pagina: string; acao: string; count: number }[];
  funcionalidades: { nome: string; count: number }[];
  eventos_por_dia: { dia: string; total: number }[];
  testadores: TestadorRow[];
  calculos_recentes: CalculoRow[];
  usuarios: UsuarioDashboardRow[];
  sugestoes: SugestaoRow[];
  avaliacoes: AvaliacaoRow[];
}

export interface UsuarioDashboardRow {
  id: string;
  email: string;
  criado_em: string;
  ultimo_acesso: string | null;
  plano: string;
  total_calculos: number;
  total_movimentos_stock: number;
  produtos_com_stock: number;
}

export interface AvaliacaoRow {
  id: string;
  visitor_id: string | null;
  usuario_id: string | null;
  estrelas: number;
  ip_address: string | null;
  criado_em: string;
}

export interface SugestaoRow {
  id: string;
  visitor_id: string | null;
  texto: string;
  ip_address: string | null;
  criado_em: string;
}

export interface TestadorRow {
  visitor_id: string;
  ip_address: string;
  pais: string;
  dispositivo: string;
  browser: string;
  os: string;
  largura_ecra: number | null;
  user_agent: string;
  primeiro_acesso: string;
  ultimo_acesso: string;
  duracao_seg: number;
  total_calculos: number;
  total_cliques: number;
  paginas_visitadas: string[];
  calculos: {
    id: string;
    nome_produto: string;
    stock_atual: number;
    lucro_total: number;
    modo: string;
    criado_em: string;
  }[];
  ultimos_eventos: { tipo: string; pagina: string | null; acao: string | null; criado_em: string }[];
}

export interface CalculoRow {
  id: string;
  visitor_id: string | null;
  tem_email: boolean;
  nome_produto: string;
  stock_atual: number;
  unidades: number;
  preco_recomendado: number;
  lucro_total: number;
  modo: string;
  guardado: boolean;
  criado_em: string;
}

export type AdminSection =
  | 'overview'
  | 'testadores'
  | 'calculos'
  | 'paginas'
  | 'dispositivos'
  | 'usuarios'
  | 'sugestoes'
  | 'avaliacoes';
