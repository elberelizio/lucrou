'use client';

import { CustoAdicional } from '@/lib/types';
import CampoInput from '@/components/ui/CampoInput';
import { useI18n } from '@/lib/i18n/context';

interface OutrosCustosProps {
  custos: CustoAdicional[];
  onChange: (custos: CustoAdicional[]) => void;
}

export default function OutrosCustos({ custos, onChange }: OutrosCustosProps) {
  const { t } = useI18n();

  const adicionarCusto = () => {
    onChange([...custos, { id: Date.now().toString(), nome: '', valor: 0 }]);
  };

  const removerCusto = (id: string) => {
    onChange(custos.filter((c) => c.id !== id));
  };

  const atualizarCusto = (id: string, campo: 'nome' | 'valor', valor: string | number) => {
    onChange(custos.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  };

  return (
    <div className="space-y-3">
      {custos.map((custo) => (
        <div key={custo.id} className="flex gap-2">
          <CampoInput
            label=""
            value={custo.nome}
            onChange={(e) => atualizarCusto(custo.id, 'nome', e.target.value)}
            placeholder={t('outrosCustos.nomePlaceholder')}
            className="flex-1"
          />
          <CampoInput
            label=""
            type="number"
            value={custo.valor || ''}
            onChange={(e) => atualizarCusto(custo.id, 'valor', parseFloat(e.target.value) || 0)}
            placeholder={t('outrosCustos.valorPlaceholder')}
            inputMode="numeric"
            className="w-32"
          />
          <button
            type="button"
            onClick={() => removerCusto(custo.id)}
            className="mt-6 px-4 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={adicionarCusto}
        className="flex items-center gap-2 py-3 px-4 border-2 border-dashed border-creme-2 rounded-2xl text-texto-med hover:border-verde-cl hover:text-verde transition-colors w-fit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>{t('outrosCustos.add')}</span>
      </button>
    </div>
  );
}
