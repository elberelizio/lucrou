import { ResultadoCalculo } from '@/lib/types';
import { formatarMT } from '@/lib/calculos';

interface LucroTotalBannerProps {
  resultado: ResultadoCalculo;
}

export default function LucroTotalBanner({ resultado }: LucroTotalBannerProps) {
  if (resultado.modo === 'modoB' || resultado.unidades === 1) {
    return null;
  }

  return (
    <div className="bg-verde rounded-[18px] p-[18px] text-white flex items-center justify-between mb-3">
      <div>
        <div className="text-[13px] opacity-80 mb-1">Se venderes tudo</div>
        <div className="text-xs opacity-60">{resultado.unidades} unidades × {formatarMT(resultado.lucroPorUnidade)}</div>
      </div>
      <div className="font-serif text-[26px]">{formatarMT(resultado.lucroTotal)}</div>
    </div>
  );
}
