'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface LucroSelectorProps {
  valor: number;
  onChange: (valor: number) => void;
}

export default function LucroSelector({ valor, onChange }: LucroSelectorProps) {
  const { t } = useI18n();
  const opcoes = [15, 30, 50];
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);

  const labels: Record<number, string> = {
    15: t('lucroSelector.small'),
    30: t('lucroSelector.normal'),
    50: t('lucroSelector.good'),
  };

  useEffect(() => {
    if (!isFocusedRef.current) {
      if (opcoes.includes(valor)) {
        setCustomInputValue('');
      } else if (valor > 0) {
        setCustomInputValue(valor.toString());
      } else {
        setCustomInputValue('');
      }
    }
  }, [valor]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomInputValue(inputValue);

    if (inputValue === '') {
      onChange(0);
    } else {
      const num = parseFloat(inputValue);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        onChange(num);
      }
    }
  };

  const handleCustomFocus = () => {
    isFocusedRef.current = true;
    if (opcoes.includes(valor)) {
      setCustomInputValue('');
    } else {
      setCustomInputValue(valor > 0 ? valor.toString() : '');
    }
  };

  const handleCustomBlur = () => {
    isFocusedRef.current = false;
    if (customInputValue === '' && valor === 0) {
      setCustomInputValue('');
    } else if (valor > 0 && !opcoes.includes(valor)) {
      setCustomInputValue(valor.toString());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {opcoes.map((opcao) => {
          const isSelected = valor === opcao;
          return (
            <button
              key={opcao}
              type="button"
              onClick={() => onChange(opcao)}
              className={`
                flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all active:scale-[0.98]
                ${
                  isSelected
                    ? 'bg-[#E8F5EE] border-[#4CAF75] shadow-sm'
                    : 'bg-white border-[#F0EBE1] hover:border-verde-cl'
                }
              `}
            >
              <div className={`text-base font-bold ${isSelected ? 'text-[#1B5E3B]' : 'text-texto'}`}>{opcao}%</div>
              <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#1B5E3B] font-medium' : 'text-texto-cl'}`}>
                {labels[opcao]}
              </div>
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <label className="text-[12px] text-texto-med">{t('lucroSelector.customLabel')}</label>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="number"
            value={
              customInputValue !== ''
                ? customInputValue
                : opcoes.includes(valor)
                  ? valor
                  : valor > 0
                    ? valor
                    : ''
            }
            onChange={handleCustomChange}
            onFocus={handleCustomFocus}
            onBlur={handleCustomBlur}
            placeholder="Ex: 25"
            className="flex-1 bg-white border-[1.5px] border-creme-2 rounded-[14px] px-[18px] py-[15px] text-[15px] focus:outline-none focus:border-verde-cl"
            inputMode="numeric"
          />
          <span className="text-texto-med">%</span>
        </div>
      </div>
    </div>
  );
}
