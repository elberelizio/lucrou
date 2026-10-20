'use client';

import HeroCard from '@/components/home/HeroCard';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProdutoGuardado } from '@/lib/types';
import { formatarMT } from '@/lib/calculos';
import { useI18n } from '@/lib/i18n/context';
import { MODO_LANCAMENTO_GRATUITO, SHOW_RESUMO } from '@/lib/limites';
import { localeToNumberFormat } from '@/lib/i18n/localeUtils';

export default function HomePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const nf = localeToNumberFormat(locale);
  const { isAuthenticated, session, totalCalculos, loading: authLoading } = useAuth();
  const [produtos, setProdutos] = useState<ProdutoGuardado[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function carregarProdutos() {
      if (isAuthenticated && session) {
        try {
          const response = await fetch('/api/calculos', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const calculos: Record<string, unknown>[] = data.calculos ?? [];

            const lista: ProdutoGuardado[] = calculos.slice(0, 5).map((calc) => ({
              id: String(calc.id),
              nome: String(calc.nome_produto),
              precoRecomendado: Number(calc.preco_recomendado),
              lucroTotal: Number(calc.lucro_total ?? 0),
              margemPercent: Number(calc.lucro_percent),
              ultimaActualizacao: String(calc.criado_em),
              status: Number(calc.lucro_por_unidade) > 0 ? 'bom' : 'limite',
              dadosCalculo: {} as ProdutoGuardado['dadosCalculo'],
              modo: (calc.modo as 'modoA' | 'modoB') || 'modoA',
            }));

            const newStockMap: Record<string, number> = {};
            for (const calc of calculos) {
              newStockMap[String(calc.id)] = Number(calc.stock_atual ?? 0);
            }

            setProdutos(lista);
            setStockMap(newStockMap);
            setLoadingProdutos(false);
            return;
          }
        } catch {
          /* ignore */
        }
      }
      const local = storage.getProdutos().slice(0, 5);
      setProdutos(local);
      setLoadingProdutos(false);
    }

    carregarProdutos();
  }, [authLoading, isAuthenticated, session]);

  const temProdutos = !loadingProdutos && produtos.length > 0;
  const dateLocale = locale === 'pt' ? 'pt-MZ' : 'en-US';

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />
      <HeroCard showProductsLink={totalCalculos > 0} />

      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-texto">{t('home.recentProducts')}</h2>
          {temProdutos && (
            <button
              type="button"
              onClick={() => router.push('/produtos')}
              className="text-xs font-medium"
              style={{ color: '#1B5E3B' }}
            >
              {t('home.viewAll')}
            </button>
          )}
        </div>

        {loadingProdutos ? (
          <p className="text-sm text-texto-med py-4 text-center">{t('common.loading')}</p>
        ) : produtos.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border text-center" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm text-texto-med mb-3">{t('home.noProducts')}</p>
            <button
              type="button"
              onClick={() => router.push('/calcular')}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {t('home.calculateNow')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {produtos.map((produto) => {
              const stock = stockMap[produto.id] ?? null;
              const stockBaixo = stock !== null && stock <= 3 && stock > 0;
              const stockEsgotado = stock !== null && stock === 0;

              return (
                <div
                  key={produto.id}
                  className="bg-white rounded-2xl p-4 border flex items-center justify-between gap-3"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-texto text-sm truncate">{produto.nome}</p>
                    <p className="text-xs text-texto-med mt-0.5">
                      {new Date(produto.ultimaActualizacao).toLocaleDateString(dateLocale)}
                    </p>
                    {isAuthenticated && stock !== null && (
                      <span
                        className={`inline-block text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${
                          stockEsgotado
                            ? 'bg-red-100 text-red-700'
                            : stockBaixo
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {stockEsgotado
                          ? t('home.outOfStock')
                          : stockBaixo
                            ? t('home.stockLowMsg', { n: stock })
                            : t('home.stockMsg', { n: stock })}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#1B5E3B' }}>
                      {formatarMT(produto.precoRecomendado, nf)}
                    </p>
                    <p className="text-xs text-texto-med">
                      {t('home.marginPct', { n: produto.margemPercent.toFixed(0) })}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => router.push('/produtos')}
              className="w-full text-sm font-medium border rounded-2xl py-3 text-texto-med"
              style={{ borderColor: '#E5E7EB' }}
            >
              {t('home.fullHistory')}
            </button>
          </div>
        )}
      </div>

      {SHOW_RESUMO && temProdutos && (
        <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-texto">{t('home.profitSummary')}</h2>
          </div>

          {(isAuthenticated || MODO_LANCAMENTO_GRATUITO) ? (
            <button
              type="button"
              onClick={() => router.push('/resumo')}
              className="w-full rounded-2xl p-5 text-left flex items-center justify-between"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              <div>
                <p className="text-white/70 text-xs mb-1">{t('home.viewByPeriod')}</p>
                <p className="text-white font-semibold text-sm">{t('home.periodsShort')}</p>
              </div>
              <svg className="w-5 h-5 text-white/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="rounded-2xl p-5 border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-texto mb-1">
                    {produtos.length === 1
                      ? t('home.calculatedOne')
                      : t('home.calculatedMany', { n: produtos.length })}
                  </p>
                  <p className="text-xs text-texto-med">{t('home.createAccountHint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/ativar')}
                  className="text-xs font-semibold text-white px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: '#1B5E3B' }}
                >
                  {t('home.createAccount')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6" />
      <BottomNav />
    </div>
  );
}
