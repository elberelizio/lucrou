'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import HistoricoItem from '@/components/historico/HistoricoItem';
import ModalEmailSimples from '@/components/auth/ModalEmailSimples';
import { ProdutoGuardado, FormularioModoA, FormularioModoB } from '@/lib/types';
import { storage } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { MODO_LANCAMENTO_GRATUITO, SHOW_RESUMO } from '@/lib/limites';
import { getOrCreateVisitorId } from '@/lib/analytics';
import { useI18n } from '@/lib/i18n/context';

export default function HistoricoPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { isAuthenticated, session } = useAuth();
  const [produtos, setProdutos] = useState<ProdutoGuardado[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [totalAnonimo, setTotalAnonimo] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const verificarLimiteAnonimo = useCallback(async (): Promise<number> => {
    try {
      const visitorId = getOrCreateVisitorId();
      const response = await fetch(`/api/calculos/count?visitor_id=${visitorId}`);
      if (!response.ok) return 0;
      const { total } = await response.json();
      return total;
    } catch {
      return 0;
    }
  }, []);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated && session) {
        const response = await fetch('/api/calculos', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          throw new Error('API error');
        }

        const data = await response.json();
        const calculos: Record<string, unknown>[] = data.calculos ?? [];

        const produtosConvertidos: ProdutoGuardado[] = calculos.map((calc) => {
          let dadosCalculo: FormularioModoA | FormularioModoB;

          if (calc.modo === 'modoA') {
            dadosCalculo = {
              nomeProduto: String(calc.nome_produto),
              totalPago: Number(calc.preco_compra),
              unidades: Number(calc.unidades),
              transporte: Number(calc.custo_transporte),
              outrosCustos: [],
              lucroPercent: Number(calc.lucro_percent),
            } as FormularioModoA;
          } else {
            const unidades = Number(calc.unidades);
            const precoCompra = Number(calc.preco_compra);
            dadosCalculo = {
              nomeProduto: String(calc.nome_produto),
              precoPorUnidade: unidades > 0 ? precoCompra / unidades : precoCompra,
              unidades,
              custosAdicionais: Number(calc.outros_custos),
              precoActual: Number(calc.preco_atual_cobrado || calc.preco_recomendado),
            } as FormularioModoB;
          }

          return {
            id: String(calc.id),
            nome: String(calc.nome_produto),
            precoRecomendado: Number(calc.preco_recomendado),
            lucroTotal: Number(calc.lucro_total ?? 0),
            margemPercent: Number(calc.lucro_percent),
            ultimaActualizacao: String(calc.criado_em),
            status: Number(calc.lucro_por_unidade) > 0 ? 'bom' : 'limite',
            dadosCalculo,
            modo: calc.modo as 'modoA' | 'modoB',
          };
        });

        setProdutos(produtosConvertidos);

        const newStockMap: Record<string, number> = {};
        for (const calc of calculos) {
          newStockMap[String(calc.id)] = Number(calc.stock_atual ?? 0);
        }
        setStockMap(newStockMap);
      } else {
        const local = storage
          .getProdutos()
          .sort((a, b) => new Date(b.ultimaActualizacao).getTime() - new Date(a.ultimaActualizacao).getTime());
        setProdutos(local);
        const total = await verificarLimiteAnonimo();
        setTotalAnonimo(total);
      }
    } catch {
      const local = storage
        .getProdutos()
        .sort((a, b) => new Date(b.ultimaActualizacao).getTime() - new Date(a.ultimaActualizacao).getTime());
      setProdutos(local);
      const total = await verificarLimiteAnonimo();
      setTotalAnonimo(total);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, session, verificarLimiteAnonimo]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    const handleFocus = () => carregarProdutos();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [carregarProdutos]);

  const handleRecalcular = (produto: ProdutoGuardado) => {
    localStorage.setItem('lucrou_recalcular', JSON.stringify(produto.dadosCalculo));
    localStorage.setItem('lucrou_modo_recalcular', produto.modo);
    router.push(`/calculador?modo=${produto.modo}&recalcular=true`);
  };

  const handleStockUpdated = (produtoId: string, novoStock: number) => {
    setStockMap((prev) => ({ ...prev, [produtoId]: novoStock }));
  };

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />

      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-texto mb-1">{t('produtos.title')}</h1>
            <p className="text-sm text-texto-med">{t('produtos.subtitle')}</p>
          </div>
          {isAuthenticated && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push('/stock')}
                className="text-xs text-verde font-medium border border-verde rounded-xl px-3 py-1.5"
                style={{ borderColor: '#1B5E3B' }}
              >
                {t('stockPage.openStock')}
              </button>
              {SHOW_RESUMO && (
                <button
                  type="button"
                  onClick={() => router.push('/resumo')}
                  className="text-xs text-verde font-medium border border-verde rounded-xl px-3 py-1.5"
                  style={{ borderColor: '#1B5E3B' }}
                >
                  {t('produtos.verResumo')}
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-texto-med">{t('common.loading')}</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 mb-4 flex items-center justify-center text-texto-cl">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-texto-med mb-6 text-center">{t('produtos.empty')}</p>
            <button
              type="button"
              onClick={() => router.push('/calcular')}
              className="bg-verde text-white py-3 px-6 rounded-2xl font-semibold"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {t('produtos.first')}
            </button>
          </div>
        ) : (
          <>
            {!MODO_LANCAMENTO_GRATUITO && totalAnonimo >= 10 && !isAuthenticated && (
              <div className="mx-4 mb-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                <p className="text-sm text-green-800 font-medium">{t('produtos.bannerTitle')}</p>
                <p className="text-xs text-green-600 mt-1">{t('produtos.bannerBody')}</p>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="mt-3 text-sm font-medium text-green-700 underline"
                >
                  {t('produtos.saveEmail')}
                </button>
              </div>
            )}
            <div className="space-y-4 mb-6">
              {produtos.map((produto) => (
                <HistoricoItem
                  key={produto.id}
                  produto={produto}
                  stockAtual={stockMap[produto.id] ?? 0}
                  sessionToken={session?.access_token}
                  onRecalcular={() => handleRecalcular(produto)}
                  onStockUpdated={(novoStock) => handleStockUpdated(produto.id, novoStock)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
      <ModalEmailSimples
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={() => {}}
        modo="limite"
      />
    </div>
  );
}
