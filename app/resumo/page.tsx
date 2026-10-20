'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/hooks/useAuth';
import { formatarMT } from '@/lib/calculos';
import { useI18n } from '@/lib/i18n/context';
import { localeToNumberFormat } from '@/lib/i18n/localeUtils';

type Period = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

interface Resumo {
  period: Period;
  label: string;
  total_calculos: number;
  lucro_total_estimado: number;
  produto_mais_lucrativo: { nome: string; lucro_por_unidade: number } | null;
  produto_menor_margem: { nome: string; lucro_percent: number } | null;
}

export default function ResumoPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const nf = localeToNumberFormat(locale);
  const { isAuthenticated, session, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<Period>('mensal');
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [erro, setErro] = useState('');

  const TABS = useMemo(
    () =>
      (['semanal', 'mensal', 'trimestral', 'semestral', 'anual'] as const).map((key) => ({
        key,
        label: t(`resumo.tabs.${key}`),
      })),
    [t]
  );

  const carregarResumo = useCallback(
    async (selectedPeriod: Period) => {
      setLoadingData(true);
      setErro('');

      if (!session) {
        setResumo(null);
        setLoadingData(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/resumo-mensal?period=${selectedPeriod}&locale=${locale}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setResumo(data.resumo);
          setLoadingData(false);
          return;
        }
        const data = await response.json();
        setErro(data.error || t('resultado.networkError'));
      } catch {
        setErro(t('resultado.networkError'));
      }
      setLoadingData(false);
    },
    [session, locale, t]
  );

  useEffect(() => {
    if (authLoading) return;
    carregarResumo(period);
  }, [authLoading, session, period, carregarResumo]);

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />

      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 py-7">
        <button
          type="button"
          onClick={() => router.push('/inicio')}
          className="flex items-center gap-1 text-sm text-texto-med mb-4 hover:text-texto transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('resumo.backHome')}
        </button>

        <h1 className="text-[22px] font-semibold text-texto mb-4">{t('resumo.title')}</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                period === tab.key ? 'text-white' : 'bg-white border text-texto-med'
              }`}
              style={period === tab.key ? { backgroundColor: '#1B5E3B' } : { borderColor: '#E5E7EB' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-texto-med">{t('common.loading')}</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-card border text-center" style={{ borderColor: '#E5E7EB' }}>
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('resumo.guestTitle')}</h2>
              <p className="text-gray-500 text-sm mb-3">{t('resumo.guestBody')}</p>
              <p className="text-xs text-gray-400">{t('resumo.guestHint')}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-card border" style={{ borderColor: '#E5E7EB' }}>
              <div className="text-sm text-texto-med mb-1">{t('resumo.productsCalculated')}</div>
              <div className="font-serif text-4xl font-bold text-texto">0</div>
              <div className="text-xs text-texto-cl mt-1">{t('resumo.noneInPeriod')}</div>
            </div>

            <div className="rounded-2xl p-5 shadow-card" style={{ backgroundColor: '#1B5E3B' }}>
              <div className="text-sm text-white/70 mb-1">{t('resumo.lucroTotal')}</div>
              <div className="font-serif text-4xl font-bold text-white">{formatarMT(0, nf)}</div>
              <div className="text-xs text-white/60 mt-1">{t('resumo.lucroSub')}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-card border text-center text-texto-med text-sm" style={{ borderColor: '#E5E7EB' }}>
              {t('resumo.placeholderResumo')}
            </div>
          </div>
        ) : erro ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 text-sm">{erro}</p>
            <button
              type="button"
              onClick={() => carregarResumo(period)}
              className="mt-4 text-sm text-verde hover:underline"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : resumo && resumo.total_calculos === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('resumo.emptyMonth')}</h2>
            <p className="text-gray-500 text-sm">{t('resumo.emptyHint')}</p>
          </div>
        ) : resumo ? (
          <div className="space-y-4">
            <p className="text-sm text-texto-med">{resumo.label}</p>

            <div className="bg-white rounded-2xl p-5 shadow-card border" style={{ borderColor: '#E5E7EB' }}>
              <div className="text-sm text-texto-med mb-1">{t('resumo.productsCalculated')}</div>
              <div className="font-serif text-4xl font-bold text-texto">{resumo.total_calculos}</div>
              {resumo.total_calculos === 0 && (
                <div className="text-xs text-texto-cl mt-1">{t('resumo.noneInPeriod')}</div>
              )}
            </div>

            <div className="rounded-2xl p-5 shadow-card" style={{ backgroundColor: '#1B5E3B' }}>
              <div className="text-sm text-white/70 mb-1">{t('resumo.lucroTotal')}</div>
              <div className="font-serif text-4xl font-bold text-white">
                {formatarMT(resumo.lucro_total_estimado, nf)}
              </div>
              <div className="text-xs text-white/60 mt-1">{t('resumo.lucroSub')}</div>
            </div>

            {resumo.produto_mais_lucrativo ? (
              <div className="bg-white rounded-2xl p-5 shadow-card border" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-lg">
                    🏆
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-texto-med mb-0.5">{t('resumo.maisLucrativo')}</div>
                    <div className="font-semibold text-texto mb-1 truncate">
                      {resumo.produto_mais_lucrativo.nome}
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#1B5E3B' }}>
                      {formatarMT(resumo.produto_mais_lucrativo.lucro_por_unidade, nf)} {t('resumo.perUnit')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              resumo.total_calculos === 0 && (
                <div
                  className="bg-white rounded-2xl p-5 shadow-card border text-center text-texto-med text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  {t('resumo.placeholderResumo')}
                </div>
              )
            )}

            {resumo.produto_menor_margem && (
              <div className="bg-white rounded-2xl p-5 shadow-card border" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 text-lg">
                    ⚠️
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-texto-med mb-0.5">{t('resumo.menorMargem')}</div>
                    <div className="font-semibold text-texto mb-1 truncate">{resumo.produto_menor_margem.nome}</div>
                    <div className="text-sm text-yellow-600 font-medium">
                      {t('resumo.margemDe', { n: resumo.produto_menor_margem.lucro_percent.toFixed(1) })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
