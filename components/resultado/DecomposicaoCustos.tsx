'use client';

import { ResultadoCalculo } from '@/lib/types';
import { formatarMT } from '@/lib/calculos';
import { useI18n } from '@/lib/i18n/context';
import { decomposeLineLabel } from '@/lib/i18n/decomposeLabels';
import { localeToNumberFormat } from '@/lib/i18n/localeUtils';

interface DecomposicaoCustosProps {
  resultado: ResultadoCalculo;
}

export default function DecomposicaoCustos({ resultado }: DecomposicaoCustosProps) {
  const { t, locale } = useI18n();
  const nf = localeToNumberFormat(locale);
  const lucroPorUnidade = resultado.precoRecomendado - resultado.custoPorUnidade;
  const custoTotal = Object.values(resultado.decomposicao).reduce((acc, valor) => acc + valor, 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border" style={{ borderColor: '#E5E7EB' }}>
      <div className="space-y-3">
        <div className="space-y-2">
          {Object.entries(resultado.decomposicao).map(([nome, valor]) => (
            <div key={nome} className="flex justify-between text-sm">
              <span className="text-texto-med">{decomposeLineLabel(nome, locale)}</span>
              <span className="font-medium text-texto">{formatarMT(valor, nf)}</span>
            </div>
          ))}
        </div>

        <div className="border-t" style={{ borderColor: '#E5E7EB' }} />

        <div className="flex justify-between text-sm">
          <span className="text-texto font-medium">{t('decomposicao.custoTotal')}</span>
          <span className="font-semibold text-texto">{formatarMT(custoTotal, nf)}</span>
        </div>

        {resultado.unidades > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-texto-med">{t('decomposicao.custoUnidade')}</span>
            <span className="font-medium text-texto">{formatarMT(resultado.custoPorUnidade, nf)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-texto-med">{t('decomposicao.lucroPct', { n: resultado.margemPercent.toFixed(0) })}</span>
          <span className="font-medium text-verde">{formatarMT(lucroPorUnidade, nf)}</span>
        </div>

        <div className="border-t-2" style={{ borderColor: '#1B5E3B' }} />

        <div className="flex justify-between text-base">
          <span className="text-verde font-bold">{t('decomposicao.precoCobrar')}</span>
          <span className="font-bold text-verde text-lg">{formatarMT(resultado.precoRecomendado, nf)}</span>
        </div>
      </div>
    </div>
  );
}
