'use client';

import { ProdutoGuardado } from '@/lib/types';
import { formatarMT } from '@/lib/calculos';
import { useI18n } from '@/lib/i18n/context';
import { localeToNumberFormat } from '@/lib/i18n/localeUtils';

interface ProdutoItemProps {
  produto: ProdutoGuardado;
  onRecalcular: () => void;
  onEliminar: () => void;
}

export default function ProdutoItem({ produto, onRecalcular: _onRecalcular, onEliminar: _onEliminar }: ProdutoItemProps) {
  const { t, locale } = useI18n();
  const nf = localeToNumberFormat(locale);

  const statusCores = {
    bom: 'bg-verde-cl',
    limite: 'bg-yellow-500',
    prejuizo: 'bg-red-500',
  }[produto.status];

  const diasAtras = Math.floor((Date.now() - new Date(produto.ultimaActualizacao).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-[18px] p-4 pr-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
      <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${statusCores}`} />
      <div className="flex-1">
        <div className="text-sm font-semibold text-texto">{produto.nome}</div>
        <div className="text-xs text-texto-cl mt-0.5">
          {t('produtoItem.margem')} {produto.margemPercent.toFixed(1)}% ·{' '}
          {t('historico.atualizado', {
            n: diasAtras,
            unit: diasAtras === 1 ? t('historico.dia') : t('historico.dias'),
          })}
        </div>
      </div>
      <div className="text-[15px] font-bold text-verde">{formatarMT(produto.precoRecomendado, nf)}</div>
    </div>
  );
}
