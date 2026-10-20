'use client';

import { ProdutoGuardado } from '@/lib/types';
import { formatarMT } from '@/lib/calculos';
import { StockControle } from './StockControle';
import { STOCK_LOW_THRESHOLD } from '@/lib/limites';
import { useI18n } from '@/lib/i18n/context';
import { localeToNumberFormat } from '@/lib/i18n/localeUtils';

interface HistoricoItemProps {
  produto: ProdutoGuardado;
  stockAtual?: number;
  sessionToken?: string;
  onRecalcular: () => void;
  onStockUpdated?: (novoStock: number) => void;
}

export default function HistoricoItem({
  produto,
  stockAtual,
  sessionToken,
  onRecalcular,
  onStockUpdated,
}: HistoricoItemProps) {
  const { t, locale } = useI18n();
  const nf = localeToNumberFormat(locale);

  const getSemaforoColor = () => {
    if (stockAtual !== undefined) {
      if (stockAtual <= 0) return '🔴';
      if (stockAtual <= STOCK_LOW_THRESHOLD) return '🟡';
      return '🟢';
    }

    if (produto.margemPercent <= 0) return '🔴';
    if (produto.margemPercent >= 20) return '🟢';
    return '🟡';
  };

  const getSemaforoBgColor = () => {
    if (stockAtual !== undefined) {
      if (stockAtual <= 0) return 'bg-red-100';
      if (stockAtual <= STOCK_LOW_THRESHOLD) return 'bg-yellow-100';
      return 'bg-green-100';
    }

    if (produto.margemPercent <= 0) return 'bg-red-100';
    if (produto.margemPercent >= 20) return 'bg-green-100';
    return 'bg-yellow-100';
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    const meses = t('historico.monthsShort').split(',');
    return `${t('historico.calculadoEm')} ${data.getDate()} ${meses[data.getMonth()]} ${data.getFullYear()}`;
  };

  const showStock = sessionToken !== undefined && stockAtual !== undefined;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full ${getSemaforoBgColor()} flex items-center justify-center flex-shrink-0 text-2xl`}
        >
          {getSemaforoColor()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-texto mb-1 truncate">{produto.nome}</div>
          <div className="text-lg font-bold text-verde mb-1">{formatarMT(produto.precoRecomendado, nf)}</div>
          <div className="text-sm text-texto-med mb-1">
            {t('historico.margem')}: <span className="font-semibold">{produto.margemPercent.toFixed(0)}%</span>
          </div>
          <div className="text-xs text-texto-cl">{formatarData(produto.ultimaActualizacao)}</div>
        </div>

        <button
          type="button"
          onClick={onRecalcular}
          className="px-4 py-2 text-sm font-medium text-verde border-2 border-verde rounded-xl hover:bg-mint transition-colors flex-shrink-0"
          style={{ borderColor: '#1B5E3B' }}
        >
          {t('historico.recalcular')}
        </button>
      </div>

      {showStock && onStockUpdated && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
          <StockControle
            calculoId={produto.id}
            stockAtual={stockAtual}
            sessionToken={sessionToken}
            onStockUpdated={onStockUpdated}
          />
        </div>
      )}
    </div>
  );
}
