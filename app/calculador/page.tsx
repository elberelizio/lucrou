'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import CampoInput from '@/components/ui/CampoInput';
import LucroSelector from '@/components/calculador/LucroSelector';
import OutrosCustos from '@/components/calculador/OutrosCustos';
import { ModoCalculo, FormularioModoA, FormularioModoB, CustoAdicional } from '@/lib/types';
import { calcularModoA, calcularModoB } from '@/lib/calculos';
import { storage } from '@/lib/storage';
import { useI18n } from '@/lib/i18n/context';
import { trackMetaCustom } from '@/lib/meta-pixel';

function CalculadorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const modo = (searchParams.get('modo') as ModoCalculo) || 'modoA';
  const recalcular = searchParams.get('recalcular') === 'true';

  const [formA, setFormA] = useState<FormularioModoA>({
    nomeProduto: '',
    totalPago: 0,
    unidades: 0,
    transporte: 0,
    outrosCustos: [],
    lucroPercent: 30,
  });

  const [formB, setFormB] = useState<FormularioModoB>({
    nomeProduto: '',
    precoPorUnidade: 0,
    unidades: 0,
    custosAdicionais: 0,
    precoActual: 0,
  });

  const [precoPorUnidadeValue, setPrecoPorUnidadeValue] = useState<string>('');
  const [unidadesValue, setUnidadesValue] = useState<string>('');
  const [custosAdicionaisValue, setCustosAdicionaisValue] = useState<string>('');
  const [precoActualValue, setPrecoActualValue] = useState<string>('');
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recalcular && typeof window !== 'undefined') {
      const dadosRaw = localStorage.getItem('lucrou_recalcular');
      const modoRaw = localStorage.getItem('lucrou_modo_recalcular');
      if (dadosRaw && modoRaw) {
        try {
          const dados = JSON.parse(dadosRaw);
          if (modoRaw === 'modoA') {
            setFormA(dados as FormularioModoA);
          } else {
            const dadosB = dados as FormularioModoB;
            setFormB(dadosB);
            setPrecoPorUnidadeValue(dadosB.precoPorUnidade > 0 ? dadosB.precoPorUnidade.toString() : '');
            setUnidadesValue(dadosB.unidades > 0 ? dadosB.unidades.toString() : '');
            setCustosAdicionaisValue(dadosB.custosAdicionais > 0 ? dadosB.custosAdicionais.toString() : '');
            setPrecoActualValue(dadosB.precoActual > 0 ? dadosB.precoActual.toString() : '');
          }
          localStorage.removeItem('lucrou_recalcular');
          localStorage.removeItem('lucrou_modo_recalcular');
        } catch {
          /* ignore */
        }
      }
    }
  }, [recalcular]);

  const validarModoA = () => {
    return formA.nomeProduto.trim() !== '' && formA.totalPago > 0 && formA.unidades > 0;
  };

  const validarModoB = () => {
    return formB.precoPorUnidade > 0 && formB.unidades > 0 && formB.precoActual > 0;
  };

  const handlePrecoPorUnidadeChange = (value: string) => {
    setErrosCampos((prev) => ({ ...prev, precoPorUnidade: '' }));
    setPrecoPorUnidadeValue(value);
    setFormB({ ...formB, precoPorUnidade: parseFloat(value) || 0 });
  };

  const handleUnidadesChange = (value: string) => {
    setErrosCampos((prev) => ({ ...prev, unidades: '' }));
    setUnidadesValue(value);
    setFormB({ ...formB, unidades: parseInt(value) || 0 });
  };

  const handleCustosAdicionaisChange = (value: string) => {
    setCustosAdicionaisValue(value);
    setFormB({ ...formB, custosAdicionais: parseFloat(value) || 0 });
  };

  const handlePrecoActualChange = (value: string) => {
    setErrosCampos((prev) => ({ ...prev, precoActual: '' }));
    setPrecoActualValue(value);
    setFormB({ ...formB, precoActual: parseFloat(value) || 0 });
  };

  const handleTentarCalcular = () => {
    const erros: Record<string, string> = {};

    if (modo === 'modoA') {
      if (!formA.nomeProduto.trim()) erros.nomeProduto = t('calculador.errNome');
      if (!formA.totalPago || Number(formA.totalPago) <= 0) erros.totalPago = t('calculador.errTotalPago');
      if (!formA.unidades || Number(formA.unidades) <= 0) erros.unidades = t('calculador.errUnidades');
    } else {
      if (!formB.precoPorUnidade || Number(formB.precoPorUnidade) <= 0) {
        erros.precoPorUnidade = t('calculador.errPrecoUnidade');
      }
      if (!formB.unidades || Number(formB.unidades) <= 0) erros.unidades = t('calculador.errUnidades');
      if (!formB.precoActual || Number(formB.precoActual) <= 0) {
        erros.precoActual = t('calculador.errPrecoActual');
      }
    }

    setErrosCampos(erros);

    if (Object.keys(erros).length > 0) {
      const primeiroCampo = Object.keys(erros)[0];
      document.getElementById(primeiroCampo)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleCalcular = () => {
    const valido = modo === 'modoA' ? validarModoA() : validarModoB();
    if (!valido) {
      handleTentarCalcular();
      return;
    }

    setErrosCampos({});

    const resultado = modo === 'modoA' ? calcularModoA(formA) : calcularModoB(formB);

    const dadosFormulario = modo === 'modoA' ? formA : formB;
    localStorage.setItem('lucrou_formulario_atual', JSON.stringify(dadosFormulario));
    localStorage.setItem('lucrou_modo_atual', modo);

    storage.saveUltimoResultado(resultado);
    storage.incrementarCalculos();

    trackMetaCustom('Calculou', {
      modo,
      preco_recomendado: Math.round(resultado.precoRecomendado),
      lucro_total: Math.round(resultado.lucroTotal),
      margem_percent: Math.round(resultado.margemPercent),
    });

    // Pequeno atraso para o pixel enviar o pedido antes da navegação
    setTimeout(() => {
      router.push('/resultado');
    }, 250);
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <Logo />
      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 py-7 min-h-screen pb-[90px] pt-16">
        <h1 className="text-[22px] font-semibold text-texto mb-6">
          {modo === 'modoA' ? t('calculador.titleA') : t('calculador.titleB')}
        </h1>

        {modo === 'modoA' ? (
          <div className="flex flex-col gap-3.5 pb-6">
            <CampoInput
              id="nomeProduto"
              label={t('calculador.nomeProduto')}
              badge="obrigatorio"
              value={formA.nomeProduto}
              onChange={(e) => {
                setFormA({ ...formA, nomeProduto: e.target.value });
                setErrosCampos((prev) => ({ ...prev, nomeProduto: '' }));
              }}
              placeholder={t('calculador.placeholderProduto')}
              error={errosCampos.nomeProduto}
            />

            <CampoInput
              id="totalPago"
              label={t('calculador.totalPago')}
              badge="obrigatorio"
              type="number"
              value={formA.totalPago || ''}
              onChange={(e) => {
                setFormA({ ...formA, totalPago: parseFloat(e.target.value) || 0 });
                setErrosCampos((prev) => ({ ...prev, totalPago: '' }));
              }}
              placeholder={t('calculador.placeholderValor')}
              inputMode="numeric"
              hint={t('calculador.totalPagoHint')}
              error={errosCampos.totalPago}
            />
            <p className="text-xs text-texto-cl -mt-2">{t('calculador.totalPagoNote')}</p>

            <CampoInput
              id="unidades"
              label={t('calculador.unidadesA')}
              badge="obrigatorio"
              type="number"
              value={formA.unidades > 0 ? formA.unidades : ''}
              onChange={(e) => {
                setFormA({ ...formA, unidades: parseInt(e.target.value) || 0 });
                setErrosCampos((prev) => ({ ...prev, unidades: '' }));
              }}
              placeholder={t('calculador.placeholderUnidades')}
              inputMode="numeric"
              error={errosCampos.unidades}
            />

            <CampoInput
              label={t('calculador.transporte')}
              badge="opcional"
              type="number"
              value={formA.transporte || ''}
              onChange={(e) => setFormA({ ...formA, transporte: parseFloat(e.target.value) || 0 })}
              placeholder={t('calculador.placeholderTransporte')}
              inputMode="numeric"
              hint={t('calculador.transporteHint')}
            />

            <div>
              <OutrosCustos
                custos={formA.outrosCustos}
                onChange={(custos: CustoAdicional[]) => setFormA({ ...formA, outrosCustos: custos })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-texto mb-2">{t('calculador.lucroQual')}</label>
              <LucroSelector valor={formA.lucroPercent} onChange={(valor) => setFormA({ ...formA, lucroPercent: valor })} />
            </div>

            <button
              onClick={handleCalcular}
              className="w-full py-[19px] text-white font-semibold rounded-2xl transition-all active:scale-[0.98] tracking-wide mt-6 mb-4"
              style={{ backgroundColor: !validarModoA() ? '#9CA3AF' : '#1B5E3B' }}
            >
              {t('calculador.verPreco')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <CampoInput
              label={t('calculador.nomeProduto')}
              badge="opcional"
              value={formB.nomeProduto}
              onChange={(e) => setFormB({ ...formB, nomeProduto: e.target.value })}
              placeholder={t('calculador.placeholderProduto')}
            />

            <CampoInput
              id="precoPorUnidade"
              label={t('calculador.precoUnidade')}
              badge="obrigatorio"
              type="number"
              value={precoPorUnidadeValue}
              onChange={(e) => handlePrecoPorUnidadeChange(e.target.value)}
              placeholder={t('calculador.placeholderValor')}
              inputMode="numeric"
              error={errosCampos.precoPorUnidade}
            />

            <CampoInput
              id="unidades"
              label={t('calculador.unidadesB')}
              badge="obrigatorio"
              type="number"
              value={unidadesValue}
              onChange={(e) => handleUnidadesChange(e.target.value)}
              placeholder={t('calculador.placeholderUnidades')}
              inputMode="numeric"
              error={errosCampos.unidades}
            />

            <CampoInput
              label={t('calculador.custosAdicionais')}
              badge="opcional"
              type="number"
              value={custosAdicionaisValue}
              onChange={(e) => handleCustosAdicionaisChange(e.target.value)}
              placeholder={t('calculador.placeholderValor')}
              inputMode="numeric"
            />

            <CampoInput
              id="precoActual"
              label={t('calculador.precoActual')}
              badge="obrigatorio"
              type="number"
              value={precoActualValue}
              onChange={(e) => handlePrecoActualChange(e.target.value)}
              placeholder={t('calculador.placeholderValor')}
              inputMode="numeric"
              error={errosCampos.precoActual}
            />

            <p className="text-sm text-texto-med text-center mt-2">{t('calculador.modoBContext')}</p>

            <button
              onClick={handleCalcular}
              className="w-full py-[19px] text-white font-semibold rounded-2xl transition-all active:scale-[0.98] tracking-wide"
              style={{ backgroundColor: !validarModoB() ? '#9CA3AF' : '#1B5E3B' }}
            >
              {t('calculador.verificarPreco')}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default function CalculadorPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>{t('calculador.carregando')}</p>
        </div>
      }
    >
      <CalculadorContent />
    </Suspense>
  );
}
