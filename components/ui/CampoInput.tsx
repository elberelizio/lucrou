'use client';

import { InputHTMLAttributes } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface CampoInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  badge?: 'obrigatorio' | 'opcional';
  hint?: string;
  error?: string;
}

export default function CampoInput({
  label,
  badge,
  hint,
  error,
  className = '',
  ...props
}: CampoInputProps) {
  const { t } = useI18n();

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-texto">{label}</label>
        {badge === 'obrigatorio' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-mint text-verde rounded-[10px] uppercase tracking-wider">
            {t('common.required')}
          </span>
        )}
        {badge === 'opcional' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-laranja-cl text-laranja rounded-[10px] uppercase tracking-wider">
            {t('common.optional')}
          </span>
        )}
      </div>
      <input
        className={`
          w-full bg-white border-[1.5px] rounded-[14px] px-[18px] py-[15px]
          text-[15px] text-texto placeholder-texto-cl
          focus:outline-none focus:border-verde-cl transition-colors
          ${error ? 'border-red-400' : 'border-creme-2'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-[12px] text-texto-cl px-1">{hint}</p>}
      {error && <p className="text-[12px] text-red-500 px-1">{error}</p>}
    </div>
  );
}
