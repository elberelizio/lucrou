export type ModoCalculo = 'modoA' | 'modoB';

export type StatusPreco = 'bom' | 'limite' | 'prejuizo';

export interface CustoAdicional {
  id: string;
  nome: string;
  valor: number;
}

export interface FormularioModoA {
  nomeProduto: string;
  totalPago: number;
  unidades: number;
  transporte: number;
  outrosCustos: CustoAdicional[];
  lucroPercent: number;
}

export interface FormularioModoB {
  nomeProduto: string;
  precoPorUnidade: number;
  unidades: number;
  custosAdicionais: number;
  precoActual: number;
}

export interface ResultadoCalculo {
  nomeProduto: string;
  custoPorUnidade: number;
  precoMinimo: number;
  precoRecomendado: number;
  lucroPorUnidade: number;
  lucroTotal: number;
  margemPercent: number;
  status: StatusPreco;
  unidades: number;
  decomposicao: Record<string, number>;
  modo: ModoCalculo;
}

export interface ProdutoGuardado {
  id: string;
  nome: string;
  precoRecomendado: number;
  lucroTotal: number;
  margemPercent: number;
  ultimaActualizacao: string;
  status: StatusPreco;
  dadosCalculo: FormularioModoA | FormularioModoB;
  modo: ModoCalculo;
}

export type PlanoUtilizador = 'gratuito' | 'premium' | 'pendente_premium';

// User record stored in the usuarios table
export interface UsuarioData {
  id: string;
  email: string;
  nome: string | null;
  nome_negocio: string | null;
  plano: PlanoUtilizador;
  criado_em: string;
  ultimo_acesso: string | null;
  premium_valido_ate: string | null;
}

// --- Phase 2: Stock ---

export interface StockMovement {
  id: string;
  calculo_id: string;
  usuario_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  observacao?: string;
  criado_em: string;
}

export type StockStatus = 'disponivel' | 'baixo' | 'esgotado';

export interface ProdutoComStock extends ProdutoGuardado {
  stock_atual: number;
  stock_status: StockStatus;
}

// --- Phase 2: Monthly Summary ---

export interface MonthlySummary {
  mes: string; // format: 'YYYY-MM'
  total_calculos: number;
  lucro_total_estimado: number;
  produto_mais_lucrativo: {
    nome: string;
    lucro_por_unidade: number;
  } | null;
  produto_menor_margem: {
    nome: string;
    lucro_percent: number;
  } | null;
}
