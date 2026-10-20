import { ProdutoGuardado } from '@/lib/types';
import { formatarMT } from '@/lib/calculos';

interface ProdutoBloqueadoProps {
  produto: ProdutoGuardado;
}

export default function ProdutoBloqueado({ produto }: ProdutoBloqueadoProps) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-card blur-sm opacity-50 relative">
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full bg-gray-400 mt-2" />
        <div className="flex-1">
          <h3 className="font-semibold text-texto mb-1">{produto.nome}</h3>
          <p className="text-2xl font-bold text-verde mb-2">
            {formatarMT(produto.precoRecomendado)}
          </p>
          <p className="text-sm text-texto-med">
            Margem: {produto.margemPercent.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
