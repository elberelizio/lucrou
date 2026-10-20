import { ProdutoGuardado, PlanoUtilizador, ResultadoCalculo } from './types';

const KEYS = {
  PRODUTOS: 'lucrou_produtos',
  PLANO: 'lucrou_plano',
  TOTAL_CALCULOS: 'lucrou_total_calculos',
  ULTIMO_RESULTADO: 'lucrou_ultimo_resultado',
};

export const storage = {
  getProdutos(): ProdutoGuardado[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.PRODUTOS);
    return raw ? JSON.parse(raw) : [];
  },

  saveProduto(produto: ProdutoGuardado): void {
    const lista = storage.getProdutos();
    const idx = lista.findIndex(p => p.id === produto.id);
    if (idx >= 0) {
      lista[idx] = produto;
    } else {
      lista.unshift(produto);
    }
    
    // Ordenar do mais recente para o mais antigo
    lista.sort((a, b) => new Date(b.ultimaActualizacao).getTime() - new Date(a.ultimaActualizacao).getTime());
    
    // Limitar a 10 produtos (remover os mais antigos)
    const listaLimitada = lista.slice(0, 10);
    
    localStorage.setItem(KEYS.PRODUTOS, JSON.stringify(listaLimitada));
  },

  deleteProduto(id: string): void {
    const lista = storage.getProdutos().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUTOS, JSON.stringify(lista));
  },

  getPlano(): PlanoUtilizador {
    if (typeof window === 'undefined') return 'gratuito';
    return (localStorage.getItem(KEYS.PLANO) as PlanoUtilizador) || 'gratuito';
  },

  setPlano(plano: PlanoUtilizador): void {
    localStorage.setItem(KEYS.PLANO, plano);
  },

  getTotalCalculos(): number {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(KEYS.TOTAL_CALCULOS) || '0');
  },

  incrementarCalculos(): void {
    const total = storage.getTotalCalculos() + 1;
    localStorage.setItem(KEYS.TOTAL_CALCULOS, total.toString());
  },

  saveUltimoResultado(resultado: ResultadoCalculo): void {
    localStorage.setItem(KEYS.ULTIMO_RESULTADO, JSON.stringify(resultado));
  },

  getUltimoResultado(): ResultadoCalculo | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(KEYS.ULTIMO_RESULTADO);
    return raw ? JSON.parse(raw) : null;
  },
};
