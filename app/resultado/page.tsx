'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import DecomposicaoCustos from '@/components/resultado/DecomposicaoCustos';
import UpgradeModal from '@/components/ui/UpgradeModal';
import ModalEmailSimples from '@/components/auth/ModalEmailSimples';
import ModalAvaliacao from '@/components/feedback/ModalAvaliacao';
import { ResultadoCalculo, FormularioModoB, FormularioModoA } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatarMT } from '@/lib/calculos';
import { abrirWhatsApp, gerarMensagemWhatsApp } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import { MODO_LANCAMENTO_GRATUITO } from '@/lib/limites';
import { getOrCreateVisitorId, registarCalculoAnonimo } from '@/lib/analytics';
import { useI18n } from '@/lib/i18n/context';
import { localeToNumberFormat } from '@/lib/i18n/localeUtils';
import { translate } from '@/lib/i18n/messages';
import { trackMetaCustom } from '@/lib/meta-pixel';

export default function ResultadoPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const nf = localeToNumberFormat(locale);
  const { isAuthenticated, session, atualizarTotalCalculos, loading: authLoading } = useAuth();
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [precoActualModoB, setPrecoActualModoB] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [calculoGuardadoId, setCalculoGuardadoId] = useState<string | null>(null);
  const [stockInicial, setStockInicial] = useState('');
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [calculoAnonimoId, setCalculoAnonimoId] = useState<string | null>(null);
  const [modoEmailModal, setModoEmailModal] = useState<'guardar' | 'limite'>('guardar');
  const [showRatingModal, setShowRatingModal] = useState(false);

  const RATING_SESSION_KEY = 'lucrou_rating_session';

  useEffect(() => {
    if (!resultado) return;
    if (sessionStorage.getItem(RATING_SESSION_KEY)) return;
    const timer = setTimeout(() => setShowRatingModal(true), 1200);
    return () => clearTimeout(timer);
  }, [resultado]);

  const fecharAvaliacao = useCallback(() => {
    sessionStorage.setItem(RATING_SESSION_KEY, 'dismissed');
    setShowRatingModal(false);
  }, []);

  const enviarAvaliacao = useCallback(async (estrelas: number) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      await fetch('/api/avaliacoes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          visitor_id: getOrCreateVisitorId(),
          estrelas,
        }),
      });
    } catch {
      // não bloquear o utilizador
    }
    sessionStorage.setItem(RATING_SESSION_KEY, 'rated');
    setShowRatingModal(false);
  }, [session]);

  useEffect(() => {
    const lastResult = storage.getUltimoResultado();
    if (!lastResult) {
      router.push('/calcular');
      return;
    }
    setResultado(lastResult);

    if (lastResult.modo === 'modoB') {
      try {
        const raw = localStorage.getItem('lucrou_formulario_atual');
        if (raw) {
          const form = JSON.parse(raw) as FormularioModoB;
          setPrecoActualModoB(form.precoActual);
        }
      } catch {
        // Silently ignore parse errors — non-critical
      }
    }
  }, [router]);

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

  const handleGuardar = useCallback(async () => {
    if (!resultado) return;
    if (guardando) return;

    const rawForm = localStorage.getItem('lucrou_formulario_atual');
    const rawMode = localStorage.getItem('lucrou_modo_atual');

    if (!rawForm || !rawMode) {
      setSaveError(translate(locale, 'resultado.loadError'));
      return;
    }

    let formData: FormularioModoA | FormularioModoB;
    try {
      formData = JSON.parse(rawForm);
    } catch {
      setSaveError(translate(locale, 'resultado.parseError'));
      return;
    }

    setGuardando(true);
    setSaveError('');

    try {
      if (!isAuthenticated && !MODO_LANCAMENTO_GRATUITO) {
        const totalAnonimo = await verificarLimiteAnonimo();
        if (totalAnonimo >= 10) {
          setModoEmailModal('limite');
          setShowEmailModal(true);
          return;
        }
      }

      let payload: Record<string, unknown>;
      const visitorId = getOrCreateVisitorId();

      // If user left name blank, use "Produto" + today's date
      const nomeFinal =
        resultado.nomeProduto.trim() ||
        `${translate(locale, 'resultado.produtoFallback')} ${new Date().toLocaleDateString(locale === 'pt' ? 'pt-MZ' : 'en-US')}`;

      if (rawMode === 'modoA') {
        const formA = formData as FormularioModoA;
        const totalOutros = formA.outrosCustos.reduce((acc, c) => acc + c.valor, 0);

        payload = {
          nome_produto: nomeFinal,
          unidades: resultado.unidades,
          preco_compra: formA.totalPago,
          custo_transporte: Math.max(0, formA.transporte || 0),
          outros_custos: Math.max(0, totalOutros),
          lucro_percent: resultado.margemPercent,
          preco_recomendado: resultado.precoRecomendado,
          lucro_por_unidade: resultado.lucroPorUnidade,
          lucro_total: resultado.lucroTotal,
          modo: 'modoA',
          preco_atual_cobrado: null,
          calculo_id_anonimo: calculoAnonimoId,
          visitor_id: visitorId,
        };
      } else {
        const formB = formData as FormularioModoB;

        payload = {
          nome_produto: nomeFinal,
          unidades: resultado.unidades,
          preco_compra: formB.precoPorUnidade * formB.unidades,
          custo_transporte: 0,
          outros_custos: Math.max(0, formB.custosAdicionais || 0),
          lucro_percent: resultado.margemPercent,
          preco_recomendado: resultado.precoRecomendado,
          lucro_por_unidade: resultado.lucroPorUnidade,
          lucro_total: resultado.lucroTotal,
          modo: 'modoB',
          preco_atual_cobrado: formB.precoActual, // Save the real current price for correct recalculation
          calculo_id_anonimo: calculoAnonimoId,
          visitor_id: visitorId,
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isAuthenticated && session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/calculos', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (!MODO_LANCAMENTO_GRATUITO && response.status === 403) {
          setShowUpgradeModal(true);
          return;
        }
        if (result.error === 'limite_anonimo') {
          setModoEmailModal('limite');
          setShowEmailModal(true);
          return;
        }
        if (result.error === 'schema_analytics') {
          setSaveError(
            result.mensagem ||
              'Configuração incompleta. Contacte o administrador ou registe com email.'
          );
          return;
        }
        setSaveError(result.error || translate(locale, 'resultado.saveError'));
        return;
      }

      const calculoId = result.calculo_id || result.calculo?.id || null;
      if (calculoId) {
        localStorage.setItem('lucrou_ultimo_calculo_id', String(calculoId));
      }

      // Also save to localStorage for offline access
      storage.saveProduto({
        id: result.calculo?.id || Date.now().toString(),
        nome: nomeFinal,
        precoRecomendado: resultado.precoRecomendado,
        lucroTotal: resultado.lucroTotal,
        margemPercent: resultado.margemPercent,
        ultimaActualizacao: new Date().toISOString(),
        status: resultado.status,
        dadosCalculo: formData,
        modo: resultado.modo,
      });

      trackMetaCustom('Guardou', {
        modo: resultado.modo,
        preco_recomendado: Math.round(resultado.precoRecomendado),
        lucro_total: Math.round(resultado.lucroTotal),
        margem_percent: Math.round(resultado.margemPercent),
        autenticado: isAuthenticated,
      });

      if (isAuthenticated) {
        await atualizarTotalCalculos();
      }
      localStorage.removeItem('lucrou_pending_save');
      localStorage.removeItem('lucrou_calculo_anonimo_id');
      setCalculoAnonimoId(null);

      // Show stock prompt instead of redirecting immediately
      if (isAuthenticated) {
        setCalculoGuardadoId(result.calculo?.id || null);
      }
    } catch {
      setSaveError(translate(locale, 'resultado.networkError'));
    } finally {
      setGuardando(false);
    }
  }, [
    resultado,
    guardando,
    isAuthenticated,
    session,
    atualizarTotalCalculos,
    router,
    calculoAnonimoId,
    verificarLimiteAnonimo,
    locale,
  ]);

  const handleDefinirStock = useCallback(async (quantidade: number) => {
    setGuardandoStock(true);
    try {
      if (session && calculoGuardadoId && quantidade > 0) {
        await fetch('/api/stock/movimento', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            calculo_id: calculoGuardadoId,
            tipo: 'entrada',
            quantidade,
            observacao: translate(locale, 'resultado.stockObs'),
          }),
        });
      }
    } catch {
      // Non-critical — proceed to redirect regardless
    } finally {
      router.push('/produtos');
    }
  }, [session, calculoGuardadoId, router, locale]);

  // Auto-save when user returns from magic link authentication
  useEffect(() => {
    if (isAuthenticated && !authLoading && resultado) {
      const pendingSave = localStorage.getItem('lucrou_pending_save');
      if (pendingSave === 'true') {
        handleGuardar();
      }
    }
  }, [isAuthenticated, authLoading, resultado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const alreadyShown = localStorage.getItem('lucrou_install_hint_shown');
    if (alreadyShown !== 'true') {
      setShowInstallHint(true);
      localStorage.setItem('lucrou_install_hint_shown', 'true');
    }
  }, []);

  useEffect(() => {
    const existingId = localStorage.getItem('lucrou_calculo_anonimo_id');
    if (existingId) {
      setCalculoAnonimoId(existingId);
    }
  }, []);

  useEffect(() => {
    if (!resultado || isAuthenticated || calculoAnonimoId) return;

    const rawForm = localStorage.getItem('lucrou_formulario_atual');
    const rawMode = localStorage.getItem('lucrou_modo_atual');
    if (!rawForm || !rawMode) return;

    try {
      const formData = JSON.parse(rawForm) as FormularioModoA | FormularioModoB;
      const nomeProduto = resultado.nomeProduto.trim() || translate(locale, 'resultado.semNome');

      const dadosBase = {
        nome_produto: nomeProduto,
        unidades: resultado.unidades,
        lucro_percent: resultado.margemPercent,
        preco_recomendado: resultado.precoRecomendado,
        lucro_por_unidade: resultado.lucroPorUnidade,
        lucro_total: resultado.lucroTotal,
        modo: rawMode as 'modoA' | 'modoB',
      };

      const dados = rawMode === 'modoA'
        ? {
            ...dadosBase,
            preco_compra: (formData as FormularioModoA).totalPago,
            custo_transporte: (formData as FormularioModoA).transporte || 0,
            outros_custos: (formData as FormularioModoA).outrosCustos.reduce((acc, item) => acc + item.valor, 0),
          }
        : {
            ...dadosBase,
            preco_compra: (formData as FormularioModoB).precoPorUnidade * (formData as FormularioModoB).unidades,
            custo_transporte: 0,
            outros_custos: (formData as FormularioModoB).custosAdicionais || 0,
          };

      registarCalculoAnonimo(dados).then((id) => {
        if (id) {
          setCalculoAnonimoId(id);
          localStorage.setItem('lucrou_calculo_anonimo_id', id);
        }
      });
    } catch {
      // não interromper fluxo por falha de analytics
    }
  }, [resultado, isAuthenticated, calculoAnonimoId, locale]);

  if (!resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('resultado.loading')}</p>
      </div>
    );
  }

  const statusConfig = {
    bom: {
      label: t('resultado.statusBom'),
      icon: (
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      descricao: t('resultado.descBom', { value: formatarMT(resultado.lucroPorUnidade, nf) }),
    },
    limite: {
      label: t('resultado.statusAtencao'),
      icon: (
        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      descricao: t('resultado.descLimite'),
    },
    prejuizo: {
      label: t('resultado.statusPrejuizo'),
      icon: (
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      descricao: t('resultado.descPrejuizo'),
    },
  };

  const status = statusConfig[resultado.status];

  const precoMinimo = Math.round(resultado.precoMinimo);
  const precoRecomendado = Math.round(resultado.precoRecomendado);
  const lucroPorUnidade = Math.round(resultado.lucroPorUnidade);
  const precoMaximoAmarelo = precoRecomendado - 1;
  const lucroMaximoAmarelo = lucroPorUnidade - 1;

  const isModoB = resultado.modo === 'modoB';
  const precoActualModoBValue = precoActualModoB ? Math.round(precoActualModoB) : 0;
  const lucroActualModoB = precoActualModoB ? Math.round(precoActualModoB - resultado.custoPorUnidade) : 0;
  const lucroRecomendadoModoB = Math.round(precoRecomendado - resultado.custoPorUnidade);

  let precoAbaixoFinal = 0;
  if (precoActualModoB) {
    const preco90Percent = Math.round(precoActualModoB * 0.9);
    const precoMenos20 = Math.round(precoActualModoB - 20);
    precoAbaixoFinal = Math.max(
      Math.min(preco90Percent, precoMenos20),
      Math.round(resultado.custoPorUnidade)
    );
    if (precoAbaixoFinal >= precoActualModoBValue) {
      precoAbaixoFinal = Math.max(precoActualModoBValue - 20, Math.round(resultado.custoPorUnidade));
    }
  }
  const lucroAbaixoFinal = Math.round(precoAbaixoFinal - resultado.custoPorUnidade);

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />

      <div className={`${status.bgColor} py-6 mb-6`}>
        <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 text-center">
          {status.icon}
          <div className={`text-2xl font-bold ${status.textColor} mb-1`}>{status.label}</div>
          <div className={`text-sm ${status.textColor} opacity-80`}>{status.descricao}</div>
        </div>
      </div>

      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 py-7">
        {isModoB && precoActualModoB ? (
          <>
            <div className="text-center mb-6">
              <div className="text-sm text-texto-med mb-2">{t('resultado.cobrando')}</div>
              <div className="font-serif text-5xl font-bold text-texto flex items-baseline justify-center gap-2 mb-2">
                <span>{precoActualModoBValue}</span>
                <span className="text-2xl text-texto-cl font-normal">MT</span>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-sm text-texto-med mb-2">{t('resultado.precoRecomendado')}</div>
              <div className="font-serif text-6xl font-bold text-verde flex items-baseline justify-center gap-2">
                <span>{precoRecomendado}</span>
                <span className="text-2xl text-texto-cl font-normal">MT</span>
              </div>
            </div>

            <div className="mb-8 space-y-0 rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
              {precoActualModoBValue >= precoRecomendado ? (
                <>
                  <div className="bg-green-50 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 text-lg">🟢</span>
                      <div>
                        <div className="text-sm font-bold text-green-700">
                          {t('resultado.modoB_acima1', {
                            p: formatarMT(precoActualModoBValue, nf),
                            l: formatarMT(lucroActualModoB, nf),
                          })}
                        </div>
                        <div className="text-xs text-green-600 mt-0.5">{t('resultado.modoB_acima2')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 text-lg">🟡</span>
                      <div>
                        <div className="text-sm font-medium text-yellow-700">
                          {t('resultado.modoB_amarelo', {
                            p: formatarMT(precoRecomendado, nf),
                            l: formatarMT(lucroRecomendadoModoB, nf),
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 text-lg">🔴</span>
                      <div>
                        <div className="text-sm font-medium text-red-700">
                          {t('resultado.modoB_vermelho', {
                            p: formatarMT(precoAbaixoFinal, nf),
                            l: formatarMT(lucroAbaixoFinal, nf),
                          })}
                        </div>
                        <div className="text-xs text-red-600 mt-0.5">
                          {lucroAbaixoFinal <= 0 ? t('resultado.prejuizoCurto') : t('resultado.lucroBaixo')}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-50 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 text-lg">🟢</span>
                      <div>
                        <div className="text-sm font-bold text-green-700">
                          {t('resultado.modoB_subir', {
                            p: formatarMT(precoRecomendado, nf),
                            l: formatarMT(lucroRecomendadoModoB, nf),
                          })}
                        </div>
                        <div className="text-xs text-green-600 mt-0.5">{t('resultado.recomendado')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 text-lg">🟡</span>
                      <div>
                        <div className="text-sm font-medium text-yellow-700">
                          {t('resultado.modoB_manter', {
                            p: formatarMT(precoActualModoBValue, nf),
                            l: formatarMT(lucroActualModoB, nf),
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 text-lg">🔴</span>
                      <div>
                        <div className="text-sm font-medium text-red-700">
                          {t('resultado.modoB_vermelho', {
                            p: formatarMT(precoAbaixoFinal, nf),
                            l: formatarMT(lucroAbaixoFinal, nf),
                          })}
                        </div>
                        <div className="text-xs text-red-600 mt-0.5">
                          {lucroAbaixoFinal <= 0 ? t('resultado.prejuizoCurto') : t('resultado.lucroBaixo')}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="text-sm text-texto-med mb-2">{t('resultado.precoRecomendado')}</div>
              <div className="font-serif text-6xl font-bold text-verde flex items-baseline justify-center gap-2">
                <span>{precoRecomendado}</span>
                <span className="text-2xl text-texto-cl font-normal">MT</span>
              </div>
            </div>

            <div className="mb-8 space-y-0 rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
              <div className="bg-red-50 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-lg">🔴</span>
                  <div>
                    <div className="text-sm font-medium text-red-700">
                      {t('resultado.abaixoPrejuizo', { p: formatarMT(precoMinimo, nf) })}
                    </div>
                    <div className="text-xs text-red-600 mt-0.5">{t('resultado.naoCobre')}</div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-lg">🟡</span>
                  <div>
                    <div className="text-sm font-medium text-yellow-700">
                      {t('resultado.faixaAmarela', {
                        min: formatarMT(precoMinimo, nf),
                        max: formatarMT(precoMaximoAmarelo, nf),
                        l: formatarMT(lucroMaximoAmarelo, nf),
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-lg">🟢</span>
                  <div>
                    <div className="text-sm font-bold text-green-700">
                      {t('resultado.faixaVerde', {
                        p: formatarMT(precoRecomendado, nf),
                        l: formatarMT(lucroPorUnidade, nf),
                      })}
                    </div>
                    <div className="text-xs text-green-600 mt-0.5">{t('resultado.recomendado')}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mb-6">
          <DecomposicaoCustos resultado={resultado} />
        </div>

        {resultado.unidades > 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6 border text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-sm text-texto-med mb-2">{t('resultado.seVenderTudo')}</div>
            <div className="font-serif text-3xl font-bold text-verde mb-1">{formatarMT(resultado.lucroTotal, nf)}</div>
            <div className="text-xs text-texto-cl">
              {t('resultado.unidadesLucro', {
                n: resultado.unidades,
                l: formatarMT(Math.round(resultado.lucroPorUnidade), nf),
              })}
            </div>
          </div>
        )}

        {/* Mínimo para recuperar investimento */}
        {resultado.precoRecomendado > 0 && (() => {
          const custoTotal = resultado.custoPorUnidade * resultado.unidades;
          const minVender = Math.ceil(custoTotal / resultado.precoRecomendado);
          return (
            <div className="bg-white rounded-2xl p-5 shadow-card mb-6 border flex items-center gap-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">🎯</div>
              <div>
                <div className="text-sm text-texto-med mb-0.5">{t('resultado.minRecuperar')}</div>
                <div className="font-semibold text-texto">
                  {t('resultado.vender')}{' '}
                  <span className="text-verde font-bold text-lg">{minVender}</span>{' '}
                  {minVender === 1 ? t('common.unit') : t('common.units')}
                </div>
                <div className="text-xs text-texto-cl mt-0.5">{t('resultado.aposLucro')}</div>
              </div>
            </div>
          );
        })()}

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {saveError}
          </div>
        )}

        {/* After save: stock prompt */}
        {calculoGuardadoId ? (
          <div className="bg-white rounded-2xl p-6 shadow-card mb-4 border" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="font-semibold text-texto mb-1">{t('resultado.produtoGuardado')}</div>
              <div className="text-sm text-texto-med">{t('resultado.stockPergunta')}</div>
            </div>
            <input
              type="number"
              value={stockInicial}
              onChange={(e) => setStockInicial(e.target.value)}
              placeholder={`Ex: ${resultado.unidades}`}
              className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 text-center text-lg font-semibold focus:outline-none focus:border-verde-cl mb-3"
              inputMode="numeric"
              min="1"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDefinirStock(parseInt(stockInicial) || 0)}
                disabled={guardandoStock || !stockInicial || parseInt(stockInicial) <= 0}
                className="flex-1 py-3 text-white font-semibold rounded-2xl disabled:opacity-50"
                style={{ backgroundColor: '#1B5E3B' }}
              >
                {guardandoStock ? t('common.saving') : t('resultado.definirStock')}
              </button>
              <button
                type="button"
                onClick={() => router.push('/produtos')}
                disabled={guardandoStock}
                className="flex-1 py-3 border-2 text-texto-med font-medium rounded-2xl"
                style={{ borderColor: '#E5E7EB' }}
              >
                {t('common.skip')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full py-[19px] text-white font-semibold rounded-2xl flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {guardando ? t('common.saving') : t('resultado.guardarProduto')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (resultado) abrirWhatsApp(gerarMensagemWhatsApp(resultado, locale));
              }}
              className="w-full py-[15px] bg-white text-verde border-2 font-medium rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ borderColor: '#1B5E3B' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {t('resultado.whatsapp')}
            </button>
          </div>
        )}

        {showInstallHint && (
          <p className="text-xs text-texto-cl text-center mb-4">
            {t('resultado.installHint')}
          </p>
        )}

        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                const raw = localStorage.getItem('lucrou_formulario_atual');
                const mode = localStorage.getItem('lucrou_modo_atual');
                if (raw && mode) {
                  localStorage.setItem('lucrou_recalcular', raw);
                  localStorage.setItem('lucrou_modo_recalcular', mode);
                  router.push(`/calculador?modo=${mode}&recalcular=true`);
                }
              }}
              className="text-sm text-texto-med hover:text-verde transition-colors"
            >
              {t('resultado.recalcular')}
            </button>
            <span className="text-texto-cl">·</span>
            <button
              type="button"
              onClick={() => router.push('/calcular')}
              className="text-sm text-texto-med hover:text-verde transition-colors"
            >
              {t('resultado.outroProduto')}
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      {!MODO_LANCAMENTO_GRATUITO && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      )}
      <ModalEmailSimples
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={() => {}}
        modo={modoEmailModal}
      />
      <ModalAvaliacao
        isOpen={showRatingModal}
        onClose={fecharAvaliacao}
        onSubmit={enviarAvaliacao}
      />
    </div>
  );
}
